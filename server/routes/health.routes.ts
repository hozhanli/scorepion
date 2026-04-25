import type { Express, Request, Response } from "express";
import { Router } from "express";
import { pool } from "../db";
import { getApiPlan, getDailyLimit, getRequestCount } from "../services/football-api";
import { asyncHandler } from "../middleware/asyncHandler";
import * as fs from "fs";
import * as path from "path";

export const healthRouter = Router();

/**
 * Register health check routes on the Express app.
 * This is called during server initialization.
 */
export function registerHealthRoutes(app: Express) {
  app.use("/api/health", healthRouter);
}

// Module-level tracker for scheduler status
let lastSyncTimestamp = 0;

/**
 * Call this from sync.ts after a successful sync to update the timestamp.
 */
export function recordSyncTimestamp() {
  lastSyncTimestamp = Date.now();
}

/**
 * Check if the scheduler is running by looking at last sync timestamp.
 * Considers it running if we've synced within the last 2 hours (unless offline).
 */
function getSchedulerStatus(): "running" | "stopped" | "degraded" {
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const timeSinceLastSync = Date.now() - lastSyncTimestamp;

  if (lastSyncTimestamp === 0) {
    // Never synced yet - we just started
    return "running";
  }

  if (timeSinceLastSync > twoHoursMs) {
    return "degraded"; // Expected regular syncs but haven't seen one in 2 hours
  }

  return "running";
}

/**
 * Read version from package.json
 */
function getVersion(): string {
  try {
    const pkgPath = path.resolve(path.dirname(__dirname), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return pkg.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

/**
 * GET /api/health - Comprehensive health check with all subsystem status.
 * Returns 200 if degraded or ok, 503 if down.
 */
healthRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const entry: any = {
        status: "ok",
        uptime: Math.floor(process.uptime()),
        timestamp: Date.now(),
        version: getVersion(),
        checks: {},
      };

      // Database check with latency measurement
      try {
        const dbStart = Date.now();
        const result = await Promise.race([
          pool.query("SELECT 1"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
        ]);
        const dbLatencyMs = Date.now() - dbStart;

        entry.checks.database = {
          status: dbLatencyMs > 500 ? "degraded" : "ok",
          latencyMs: dbLatencyMs,
        };
      } catch (error) {
        entry.checks.database = { status: "down" };
      }

      // API Football quota check
      try {
        const hasApiKey = !!process.env.FOOTBALL_API_KEY;
        if (!hasApiKey) {
          entry.checks.apiFootball = { status: "unconfigured" };
        } else {
          const quotaUsed = getRequestCount();
          const quotaLimit = getDailyLimit();
          const quotaRemaining = quotaLimit - quotaUsed;

          entry.checks.apiFootball = {
            status: quotaRemaining < 100 ? "degraded" : "ok",
            quotaUsed,
            quotaLimit,
            quotaRemaining,
          };
        }
      } catch (error) {
        entry.checks.apiFootball = { status: "ok" }; // Assume ok on error
      }

      // Scheduler status check
      entry.checks.scheduler = {
        status: getSchedulerStatus(),
        lastSyncAt: lastSyncTimestamp || null,
      };

      // Determine overall status
      const dbStatus = entry.checks.database?.status;
      const apiStatus = entry.checks.apiFootball?.status;
      const schedulerStatus = entry.checks.scheduler?.status;

      if (dbStatus === "down" || apiStatus === "down") {
        entry.status = "down";
      } else if (
        dbStatus === "degraded" ||
        apiStatus === "degraded" ||
        schedulerStatus === "degraded"
      ) {
        entry.status = "degraded";
      }

      entry.durationMs = Date.now() - startTime;

      const statusCode = entry.status === "down" ? 503 : 200;
      return res.status(statusCode).json(entry);
    } catch (error) {
      console.error("[Health Check] Unexpected error:", error);
      return res.status(503).json({
        status: "down",
        timestamp: Date.now(),
        error: "Failed to retrieve health status",
      });
    }
  }),
);

/**
 * GET /api/health/live - Liveness probe (K8s).
 * Returns 200 if the process can respond. Always succeeds unless the server is dead.
 */
healthRouter.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive", timestamp: Date.now() });
});

/**
 * GET /api/health/ready - Readiness probe (K8s).
 * Returns 200 if the server can handle requests (DB connected, API quota ok).
 * Returns 503 if any critical service is down.
 */
healthRouter.get(
  "/ready",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      // Quick DB check
      await Promise.race([
        pool.query("SELECT 1"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
      ]);

      // Check API quota (if configured)
      const hasApiKey = !!process.env.FOOTBALL_API_KEY;
      if (hasApiKey) {
        const quotaRemaining = getDailyLimit() - getRequestCount();
        if (quotaRemaining < 100) {
          return res.status(503).json({
            status: "not_ready",
            reason: "API quota depleted",
            quotaRemaining,
          });
        }
      }

      return res.status(200).json({ status: "ready", timestamp: Date.now() });
    } catch (error) {
      return res.status(503).json({
        status: "not_ready",
        reason: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      });
    }
  }),
);
