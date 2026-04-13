/**
 * sync.routes.ts — Admin endpoints for manual sync triggers and quota monitoring.
 * All routes require admin auth (x-admin-key header or session-based admin flag).
 */
import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import * as sync from "../services/sync";
import * as api from "../services/football-api";
import { pool } from "../db";
import { asyncHandler } from "../middleware/asyncHandler";

export const syncRouter = Router();

/**
 * Helper to extract string value from Express req.params/req.query
 * which may be string | string[] | undefined
 */
const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : Array.isArray(v) && typeof v[0] === "string" ? v[0] : fallback;

// GET /api/sync/status — quota + recent sync log
syncRouter.get("/status", requireAdmin, asyncHandler(async (_req, res: Response) => {
  try {
    const status = await sync.getSyncStatus();
    return res.json(status);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed" });
  }
}));

// POST /api/sync/full — trigger full sync across all leagues
syncRouter.post("/full", requireAdmin, asyncHandler(async (_req, res: Response) => {
  try {
    const result = await sync.syncAllData();
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Sync failed" });
  }
}));

// POST /api/sync/live — trigger live score poll immediately
syncRouter.post("/live", requireAdmin, asyncHandler(async (_req, res: Response) => {
  try {
    const updated = await sync.syncLiveScores();
    return res.json({ ok: true, updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Live sync failed" });
  }
}));

// POST /api/sync/settle — settle predictions
syncRouter.post("/settle", requireAdmin, asyncHandler(async (_req, res: Response) => {
  try {
    const settled = await sync.settlePredictions();
    return res.json({ ok: true, settled });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Settlement failed" });
  }
}));

// POST /api/sync/league/:leagueId — sync one league
syncRouter.post("/league/:leagueId", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { leagueId } = req.params;
  try {
    const fixtures  = await sync.syncFixturesForLeague(asString(leagueId));
    const standings = await sync.syncStandingsForLeague(asString(leagueId));
    const scorers   = await sync.syncTopScorersForLeague(asString(leagueId));
    return res.json({ ok: true, fixtures, standings, scorers });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}));

// POST /api/sync/enrich — enrich recently finished fixtures (events/lineups/stats)
syncRouter.post("/enrich", requireAdmin, asyncHandler(async (_req, res: Response) => {
  try {
    const enriched = await sync.enrichFinishedFixtures();
    return res.json({ ok: true, enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Enrichment failed" });
  }
}));

// GET /api/sync/quota — just the quota numbers
syncRouter.get("/quota", requireAuth, asyncHandler(async (_req, res: Response) => {
  const remaining = api.getRemainingRequests();
  const used      = api.getRequestCount();
  return res.json({ used, remaining, limit: 7500 });
}));

// GET /api/sync/leagues — all configured leagues with metadata
syncRouter.get("/leagues", asyncHandler(async (_req, res: Response) => {
  return res.json(
    Object.entries(api.LEAGUE_MAP).map(([id, cfg]) => ({
      id,
      name:    cfg.name,
      country: cfg.country,
      season:  cfg.season,
      apiId:   cfg.apiId,
      type:    cfg.type,
      priority: cfg.priority,
    }))
  );
}));
