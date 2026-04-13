import { Router, Request, Response } from "express";
import * as footballService from "../services/football.service";
import { asyncHandler } from "../middleware/asyncHandler";

export const footballRouter = Router();

/**
 * Helper to extract string value from Express req.params/req.query
 * which may be string | string[] | undefined
 */
const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : Array.isArray(v) && typeof v[0] === "string" ? v[0] : fallback;

// ── Leagues ───────────────────────────────────────────────────────────────────
footballRouter.get(
  "/leagues",
  asyncHandler(async (_req, res) => {
    res.json(await footballService.getAllLeagues());
  }),
);

// ── Fixtures ──────────────────────────────────────────────────────────────────
footballRouter.get(
  "/fixtures",
  asyncHandler(async (req, res) => {
    const { league, status, date } = req.query;
    res.json(
      await footballService.getFixtures({
        league: typeof league === "string" ? league : undefined,
        status: typeof status === "string" ? status : undefined,
        date: typeof date === "string" ? date : undefined,
      }),
    );
  }),
);

// ── Fixture detail (events + lineups + stats) ─────────────────────────────────

function parseFixtureId(raw: string): number {
  const id = parseInt(raw, 10);
  if (isNaN(id)) throw new footballService.FootballError("Invalid fixture ID");
  return id;
}

footballRouter.get(
  "/fixtures/:fixtureId/events",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getFixtureEvents(parseFixtureId(asString(req.params.fixtureId))));
  }),
);

footballRouter.get(
  "/fixtures/:fixtureId/lineups",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getFixtureLineups(parseFixtureId(asString(req.params.fixtureId))));
  }),
);

footballRouter.get(
  "/fixtures/:fixtureId/stats",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getFixtureMatchStats(parseFixtureId(asString(req.params.fixtureId))));
  }),
);

// ── Standings ─────────────────────────────────────────────────────────────────
footballRouter.get(
  "/standings/:leagueId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getStandings(asString(req.params.leagueId)));
  }),
);

// ── Top players ───────────────────────────────────────────────────────────────
footballRouter.get(
  "/top-scorers/:leagueId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getTopScorers(asString(req.params.leagueId)));
  }),
);

footballRouter.get(
  "/top-assists/:leagueId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getTopAssists(asString(req.params.leagueId)));
  }),
);

footballRouter.get(
  "/top-yellow-cards/:leagueId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getTopYellowCards(asString(req.params.leagueId)));
  }),
);

footballRouter.get(
  "/top-red-cards/:leagueId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getTopRedCards(asString(req.params.leagueId)));
  }),
);

// ── H2H ───────────────────────────────────────────────────────────────────────
footballRouter.get(
  "/h2h/:team1Id/:team2Id",
  asyncHandler(async (req, res) => {
    const t1 = parseInt(asString(req.params.team1Id), 10);
    const t2 = parseInt(asString(req.params.team2Id), 10);
    if (isNaN(t1) || isNaN(t2)) {
      throw new footballService.FootballError("Invalid team IDs");
    }
    res.json(await footballService.getH2H(t1, t2));
  }),
);

// ── Team stats ────────────────────────────────────────────────────────────────
footballRouter.get(
  "/team-stats/:teamId",
  asyncHandler(async (req, res) => {
    const stats = await footballService.getTeamStats(asString(req.params.teamId));
    res.json(stats ?? { found: false });
  }),
);

// ── Injuries + transfers ──────────────────────────────────────────────────────
footballRouter.get(
  "/injuries/:leagueId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getInjuries(asString(req.params.leagueId)));
  }),
);

footballRouter.get(
  "/transfers/:leagueId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getTransfers(asString(req.params.leagueId)));
  }),
);

// ── Community picks ───────────────────────────────────────────────────────────
footballRouter.get(
  "/community-picks/:matchId",
  asyncHandler(async (req, res) => {
    res.json(await footballService.getCommunityPicks(asString(req.params.matchId)));
  }),
);
