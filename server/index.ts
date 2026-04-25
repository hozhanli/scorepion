import express from "express";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { registerHealthRoutes } from "./routes/health.routes";
import { authLimiter, adminLimiter, writeLimiter, readLimiter } from "./middleware/rate-limit";
import { requestLog } from "./middleware/request-log";
import * as fs from "fs";
import * as path from "path";
import { getStripeClient } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { runMigrations } from "./migrations/runner";
import { initSentryServer, sentryRequestHandler, sentryErrorHandler } from "./sentry";
import { logger } from "./lib/logger";
import { checkEnv } from "./env";

// Validate environment before anything else — fails fast in production
// with a clear message if a required var is missing.
checkEnv();

const app = express();

// Initialize Sentry first, before any other middleware or routes
initSentryServer();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the base URL the server is reachable at (for Stripe redirects, etc.). */
function getBaseUrl(): string {
  // APP_URL is the canonical public URL; fallback to PORT-based localhost for dev.
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const port = process.env.PORT || "5000";
  return `http://localhost:${port}`;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origin = req.header("origin");

    // Allow configured origins via comma-separated ALLOWED_ORIGINS env var
    const allowedOrigins = new Set<string>();
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").forEach((o) => {
        allowedOrigins.add(o.trim());
      });
    }

    // Always allow localhost for development (any port)
    const isLocalhost =
      origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");

    if (origin && (allowedOrigins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
}

function setupSecurity(app: express.Application) {
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.set("trust proxy", 1);
}

function setupRateLimiting(app: express.Application) {
  // Tier A: Auth routes (strict) — 10 req/min
  app.use("/api/auth", authLimiter);

  // Tier B: Admin routes (very strict) — 30 req/min
  app.use("/api/football/sync", adminLimiter);

  // Tier C: Write routes (moderate) — 60 req/min
  app.use(["/api/predictions", "/api/groups", "/api/account"], writeLimiter);

  // Tier D: Read routes (loose) — 300 req/min (catch-all, applied last)
  app.use(readLimiter);
}

function setupRequestLogging(app: express.Application) {
  // Apply structured request logging for all requests
  app.use(requestLog);
}

// ---------------------------------------------------------------------------
// Expo OTA manifest + landing page
// ---------------------------------------------------------------------------

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(process.cwd(), "static-build", platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl!)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(process.cwd(), "server", "templates", "landing-page.html");
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  logger.info("Serving static Expo files with dynamic manifest routing");

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) return next();
    if (req.path !== "/" && req.path !== "/manifest") return next();

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    if (req.path === "/") {
      return serveLandingPage({ req, res, landingPageTemplate, appName });
    }

    next();
  });

  // Static assets with cache headers
  app.use("/assets", express.static(path.resolve(process.cwd(), "assets"), { maxAge: "7d" }));
  app.use(
    express.static(path.resolve(process.cwd(), "static-build"), {
      maxAge: "1d",
    }),
  );

  logger.info("Expo routing: Checking expo-platform header on / and /manifest");
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    logger.error({ error: err }, "Internal Server Error");

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });
}

// ---------------------------------------------------------------------------
// Stripe initialisation
// ---------------------------------------------------------------------------

async function initStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.info("[Stripe] STRIPE_SECRET_KEY not set, skipping Stripe init");
    return;
  }

  try {
    const stripe = getStripeClient();
    const webhookBaseUrl = getBaseUrl();
    const webhookUrl = `${webhookBaseUrl}/api/stripe/webhook`;

    // If a webhook secret is configured, we assume the webhook is already
    // registered in the Stripe dashboard.  Otherwise log a reminder.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      logger.info(`[Stripe] Webhook ready at ${webhookUrl}`);
    } else {
      logger.info(
        `[Stripe] STRIPE_WEBHOOK_SECRET not set — register ${webhookUrl} in your Stripe dashboard and set the signing secret.`,
      );
    }

    // Quick connectivity check
    await stripe.products.list({ limit: 1 });
    logger.info("[Stripe] Connection verified");
  } catch (error) {
    logger.error({ error }, "[Stripe] Init failed");
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

(async () => {
  setupSecurity(app);
  setupCors(app);
  registerHealthRoutes(app);

  // Stripe webhook needs raw body — must be registered BEFORE body parsing
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        logger.error("[Stripe] Webhook body is not a Buffer");
        return res.status(500).json({ error: "Webhook processing error" });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error({ message: error.message }, "[Stripe] Webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  });

  setupBodyParsing(app);
  setupRateLimiting(app);
  setupRequestLogging(app);

  // Add Sentry request handler after body parsing, before routes
  app.use(sentryRequestHandler());

  configureExpoAndLanding(app);

  try {
    await initStripe();
  } catch (err) {
    logger.error({ error: err }, "Failed to initialize Stripe");
  }

  // Run Scorepion DB migrations (adds weekly_points, group_activity, etc.)
  await runMigrations();

  const server = await registerRoutes(app);

  // Add Sentry error handler after routes, before custom error handler
  app.use(sentryErrorHandler());

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen({ port, host: "0.0.0.0" }, () => {
    logger.info(`express server serving on port ${port}`);
  });

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string) => {
    logger.info(`\n[Shutdown] Received ${signal} signal, starting graceful shutdown...`);

    try {
      const syncModule = await import("./services/sync");
      syncModule.stopCronScheduler();
      logger.info("[Shutdown] Cron scheduler stopped");

      syncModule.stopLivePolling();
      logger.info("[Shutdown] Live polling stopped");

      const { pool } = await import("./db");
      await pool.end();
      logger.info("[Shutdown] Database pool closed");

      server.close(() => {
        logger.info("[Shutdown] Server closed, exiting");
        process.exit(0);
      });

      setTimeout(() => {
        logger.info("[Shutdown] Forced exit after 10s timeout");
        process.exit(1);
      }, 10_000);
    } catch (error) {
      logger.error({ error }, "[Shutdown] Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
})();
