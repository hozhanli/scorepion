import * as footballRepo from "../repositories/football.repository";
import * as sync from "./sync";

export class FootballError extends Error {
  public status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "FootballError";
  }
}

// ─── Read-through sync cache ────────────────────────────────────────────────
//
// Lineups, stats, events, and H2H are pulled from API-Football on demand the
// first time a match detail screen opens — and then again any time the cached
// row is older than REFRESH_MS. Without this, `enrichFinishedFixtures()` only
// hits matches 4-24 hours after full-time, so upcoming/live match screens show
// nothing to the user. With this, the data appears as soon as API-Football has
// it (lineups post ~30min pre-kickoff; stats/events update during the match).
//
// The fetchCache prevents a user tapping into the screen repeatedly from
// blowing quota: once per fixture+type per 60s is enough.
const fetchCache = new Map<string, number>();
const REFRESH_MS = 60_000;

function shouldRefetch(key: string): boolean {
  const last = fetchCache.get(key);
  return !last || Date.now() - last > REFRESH_MS;
}

function markFetched(key: string): void {
  fetchCache.set(key, Date.now());
  // Keep the map bounded on long-running servers — drop anything older than 10min
  if (fetchCache.size > 500) {
    const cutoff = Date.now() - 10 * 60_000;
    for (const [k, ts] of fetchCache.entries()) {
      if (ts < cutoff) fetchCache.delete(k);
    }
  }
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface FixtureFilters {
  league?: string;
  status?: string;
  date?: string;
}

// ---------------------------------------------------------------------------
// Service functions — thin delegation with explicit types
// ---------------------------------------------------------------------------

export const getAllLeagues = () => footballRepo.getAllLeagues();

export const getFixtures = (filters: FixtureFilters) => footballRepo.getFixtures(filters);

export const getStandings = (leagueId: string) => footballRepo.getStandings(leagueId);

export const getTopScorers = (leagueId: string) => footballRepo.getTopScorers(leagueId);

export const getTopAssists = (leagueId: string) => footballRepo.getTopAssists(leagueId);

export const getTopYellowCards = (leagueId: string) => footballRepo.getTopYellowCards(leagueId);

export const getTopRedCards = (leagueId: string) => footballRepo.getTopRedCards(leagueId);

export const getInjuries = (leagueId: string) => footballRepo.getInjuries(leagueId);

export const getTransfers = (leagueId: string) => footballRepo.getTransfers(leagueId);

export const getCommunityPicks = (matchId: string) => footballRepo.getCommunityPicks(matchId);

export async function getFixtureEvents(fixtureId: number) {
  const key = `events:${fixtureId}`;
  // Events update during live matches (new goals, cards, subs), so refresh
  // on every request that's at least REFRESH_MS since the last fetch —
  // regardless of whether the DB already has rows.
  if (shouldRefetch(key)) {
    markFetched(key);
    try {
      await sync.syncFixtureEventsById(fixtureId);
    } catch (err: any) {
      console.warn(`[Service] events sync failed for ${fixtureId}:`, err.message);
    }
  }
  return footballRepo.getFixtureEvents(fixtureId);
}

export async function getFixtureLineups(fixtureId: number) {
  let rows = await footballRepo.getFixtureLineups(fixtureId);
  const key = `lineups:${fixtureId}`;
  if (rows.length === 0 && shouldRefetch(key)) {
    markFetched(key);
    try {
      await sync.syncFixtureLineupsById(fixtureId);
    } catch (err: any) {
      console.warn(`[Service] lineups sync failed for ${fixtureId}:`, err.message);
    }
    rows = await footballRepo.getFixtureLineups(fixtureId);
  }
  return rows;
}

export async function getFixtureMatchStats(fixtureId: number) {
  const key = `stats:${fixtureId}`;
  // Match stats (possession, shots, corners, etc.) accumulate during a live
  // match, so refresh on every request >= REFRESH_MS since the last fetch.
  if (shouldRefetch(key)) {
    markFetched(key);
    try {
      await sync.syncFixtureStatsById(fixtureId);
    } catch (err: any) {
      console.warn(`[Service] stats sync failed for ${fixtureId}:`, err.message);
    }
  }
  return footballRepo.getFixtureMatchStats(fixtureId);
}

export async function getH2H(team1Id: number, team2Id: number) {
  let rows = await footballRepo.getH2H(team1Id, team2Id);
  // H2H changes rarely — only re-fetch if DB has NOTHING (not every 60s).
  // Fresh H2H comes in naturally when syncFixturesForLeague adds new finished
  // games between the two teams, which already runs every 2 hours on pro.
  const [a, b] = team1Id < team2Id ? [team1Id, team2Id] : [team2Id, team1Id];
  const key = `h2h:${a}:${b}`;
  if (rows.length === 0 && shouldRefetch(key)) {
    markFetched(key);
    try {
      await sync.syncH2H(team1Id, team2Id);
    } catch (err: any) {
      console.warn(`[Service] h2h sync failed for ${a}-${b}:`, err.message);
    }
    rows = await footballRepo.getH2H(team1Id, team2Id);
  }
  return rows;
}

export async function getTeamStats(teamIdRaw: string | number) {
  const id = typeof teamIdRaw === "number" ? teamIdRaw : parseInt(teamIdRaw, 10);
  if (isNaN(id)) throw new FootballError("Invalid team ID", 400);
  return footballRepo.getTeamStats(id);
}
