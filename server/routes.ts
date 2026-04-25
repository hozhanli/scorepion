import type { Express } from "express";
import { createServer, type Server } from "node:http";
import * as sync from "./services/sync";
import { apiRouter } from "./routes/index";
import { cleanupExpiredTokens } from "./services/token.service";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api", apiRouter);

  sync
    .seedLeagues()
    .then(() => {
      console.log("[Server] Leagues seeded on startup");
      return sync.seedLeagueGroups();
    })
    .then(() => {
      console.log("[Server] League groups seeded on startup");
    })
    .catch((err) => {
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

  // Periodic cleanup of expired/revoked refresh tokens (every 6 hours)
  setInterval(
    async () => {
      try {
        const count = await cleanupExpiredTokens();
        if (count > 0) console.log(`[Token] Cleaned up ${count} expired refresh tokens`);
      } catch (err) {
        console.error("[Token] Cleanup error:", err);
      }
    },
    6 * 60 * 60 * 1000,
  );

  const httpServer = createServer(app);
  return httpServer;
}
