import type { Express } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import * as sync from "./services/sync";
import { apiRouter } from "./routes/index";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool: pool,
        createTableIfMissing: true,
      }),
      secret: (() => {
        const secret = process.env.SESSION_SECRET;
        if (!secret && process.env.NODE_ENV === "production") {
          throw new Error("SESSION_SECRET must be set in production");
        }
        if (!secret) {
          const generated = require("crypto").randomBytes(32).toString("hex");
          console.warn("[Session] No SESSION_SECRET set — using random key (sessions will not persist across restarts)");
          return generated;
        }
        return secret;
      })(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use("/api", apiRouter);

  sync.seedLeagues().then(() => {
    console.log("[Server] Leagues seeded on startup");
    return sync.seedLeagueGroups();
  }).then(() => {
    console.log("[Server] League groups seeded on startup");
  }).catch(err => {
    console.error("[Server] Failed to seed leagues/groups:", err);
  });

  // Live polling: PRO plan has 300 rpm — poll every 30s for near-realtime scores.
  // FREE plan: disabled entirely (100 req/day budget can't afford it).
  const { getApiPlan } = await import("./services/football-api");
  if (getApiPlan() === "pro") {
    sync.startLivePolling(30_000); // 30s — near-realtime with 300 rpm headroom
  } else {
    console.log("[Server] Live polling DISABLED (free plan)");
  }
  sync.startCronScheduler();

  const httpServer = createServer(app);
  return httpServer;
}
