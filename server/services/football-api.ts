/**
 * football-api.ts — API-Football v3 client
 *
 * Supports both FREE (100 req/day) and PRO (7,500 req/day) plans.
 * Set FOOTBALL_API_PLAN=free|pro in .env to control behavior.
 *
 * Rate limits per plan (from API-Football pricing page):
 *   FREE: ~10 req/min,  100 req/day
 *   PRO:  300 req/min,  7,500 req/day
 *   Ultra: 450 req/min, 75,000 req/day
 *   Mega:  900 req/min, 150,000 req/day
 *
 * Every call goes through the plan-aware rate limiter below.
 * Daily quota is tracked and enforced with a configurable safety buffer.
 *
 * No outbound calls happen outside this file. All sync logic imports from here.
 */

const API_KEY      = process.env.FOOTBALL_API_KEY ?? "";
const BASE_URL     = process.env.FOOTBALL_API_BASE_URL ?? "https://v3.football.api-sports.io";
const API_PLAN     = (process.env.FOOTBALL_API_PLAN ?? "free").toLowerCase() as "free" | "pro";
const DAILY_LIMIT  = parseInt(process.env.FOOTBALL_API_DAILY_LIMIT ?? (API_PLAN === "free" ? "100" : "7500"), 10);
const SAFETY_BUFFER = API_PLAN === "free" ? 10 : 200; // conservative buffer for free plan

export function getApiPlan() { return API_PLAN; }
export function getDailyLimit() { return DAILY_LIMIT; }

// ── League registry ─────────────────────────────────────────────────────────
// apiId matches API-Football's league IDs
// priority: 1 = live polling, 2 = daily, 3 = weekly-only stats

export interface LeagueConfig {
  apiId:    number;
  season:   number;
  color:    string;
  icon:     string;
  name:     string;
  country:  string;
  type:     "League" | "Cup" | "Tournament";
  priority: 1 | 2 | 3;
}

export const LEAGUE_MAP: Record<string, LeagueConfig> = {
  // Top 5 European leagues
  pl:  { apiId: 39,  season: 2024, color: "#3D195B", icon: "football",         name: "Premier League",      country: "England",  type: "League",     priority: 1 },
  la:  { apiId: 140, season: 2024, color: "#EE8707", icon: "football-outline", name: "La Liga",             country: "Spain",    type: "League",     priority: 1 },
  sa:  { apiId: 135, season: 2024, color: "#024494", icon: "shield",           name: "Serie A",             country: "Italy",    type: "League",     priority: 1 },
  bl:  { apiId: 78,  season: 2024, color: "#D20515", icon: "trophy",           name: "Bundesliga",          country: "Germany",  type: "League",     priority: 1 },
  l1:  { apiId: 61,  season: 2024, color: "#091C3E", icon: "star",             name: "Ligue 1",             country: "France",   type: "League",     priority: 1 },

  // Other top leagues
  tsl: { apiId: 203, season: 2024, color: "#E30A17", icon: "flag",             name: "Süper Lig",           country: "Turkey",   type: "League",     priority: 2 },
  erd: { apiId: 88,  season: 2024, color: "#F36D21", icon: "football",         name: "Eredivisie",          country: "Netherlands", type: "League",  priority: 2 },
  prl: { apiId: 94,  season: 2024, color: "#006600", icon: "football",         name: "Primeira Liga",       country: "Portugal", type: "League",     priority: 2 },
  spl: { apiId: 179, season: 2024, color: "#005BAA", icon: "football",         name: "Scottish Premiership",country: "Scotland", type: "League",     priority: 2 },
  mls: { apiId: 253, season: 2024, color: "#002B5C", icon: "football",         name: "MLS",                 country: "USA",      type: "League",     priority: 2 },

  // UEFA competitions
  ucl: { apiId: 2,   season: 2024, color: "#1A237E", icon: "globe",            name: "UEFA Champions League",country: "Europe",  type: "Cup",        priority: 1 },
  uel: { apiId: 3,   season: 2024, color: "#F68E1F", icon: "planet",           name: "UEFA Europa League",  country: "Europe",   type: "Cup",        priority: 2 },
  uce: { apiId: 848, season: 2024, color: "#2E7D32", icon: "shield-checkmark", name: "UEFA Conference League",country: "Europe", type: "Cup",        priority: 2 },

  // International
  unl: { apiId: 5,   season: 2024, color: "#0D1B2A", icon: "globe",            name: "UEFA Nations League", country: "Europe",   type: "Tournament", priority: 3 },
  wc:  { apiId: 1,   season: 2026, color: "#8B0000", icon: "trophy",           name: "FIFA World Cup",      country: "World",    type: "Tournament", priority: 2 },
};

// ── Quota tracker ────────────────────────────────────────────────────────────
let dailyCount   = 0;
let lastReset    = new Date().toDateString();
let lastCallAt   = 0;

/**
 * Per-minute rate limits from API-Football (as of 2025):
 *   FREE: ~10 req/min  → 1 call per 6s
 *   PRO:  300 req/min  → 1 call per 200ms (5/s)
 *
 * We add a small buffer to avoid hitting the hard ceiling.
 */
const RATE_LIMITS: Record<string, { rpm: number; msPerCall: number }> = {
  free: { rpm: 10,  msPerCall: 6100 },  // 10/min = 1 per 6s + 100ms buffer
  pro:  { rpm: 300, msPerCall: 220 },   // 300/min = 5/s → 200ms + 20ms buffer
};
const RATE = RATE_LIMITS[API_PLAN] ?? RATE_LIMITS.free;

export function getRateLimit() { return RATE; }

function resetIfNewDay() {
  const today = new Date().toDateString();
  if (today !== lastReset) { dailyCount = 0; lastReset = today; }
}

export function getRequestCount()     { resetIfNewDay(); return dailyCount; }
export function getRemainingRequests(){ return DAILY_LIMIT - getRequestCount(); }

export function canMakeRequest(): boolean {
  return getRemainingRequests() > SAFETY_BUFFER;
}

/**
 * Returns league IDs that should be synced based on the current API plan.
 * FREE plan: only priority-1 top 3 leagues (PL, La Liga, Serie A)
 * PRO plan: all leagues
 */
export function getActiveLeagueIds(): string[] {
  if (API_PLAN === "free") {
    // Only sync 3 leagues on free plan to stay well under 100 req/day
    return ["pl", "la", "sa"];
  }
  return Object.keys(LEAGUE_MAP);
}

export function getActiveLeagues(): Record<string, LeagueConfig> {
  const activeIds = getActiveLeagueIds();
  return Object.fromEntries(
    Object.entries(LEAGUE_MAP).filter(([id]) => activeIds.includes(id))
  );
}

async function waitForRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastCallAt;
  if (elapsed < RATE.msPerCall) {
    await new Promise(r => setTimeout(r, RATE.msPerCall - elapsed));
  }
  lastCallAt = Date.now();
}

// ── Core HTTP ────────────────────────────────────────────────────────────────
async function apiGet<T = any>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T | null> {
  resetIfNewDay();
  if (!canMakeRequest()) {
    console.warn(`[API-Football] Quota exhausted (${dailyCount}/${DAILY_LIMIT}). Skipping ${endpoint}`);
    return null;
  }
  if (!API_KEY) {
    console.error("[API-Football] FOOTBALL_API_KEY not set — no API calls possible");
    return null;
  }

  await waitForRateLimit();

  const url = new URL(endpoint, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  dailyCount++;
  console.log(`[API-Football] #${dailyCount} GET ${url.pathname}${url.search}`);

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-apisports-key": API_KEY },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(`[API-Football] HTTP ${res.status} on ${endpoint}`);
      return null;
    }

    const json: any = await res.json();

    // The API returns remaining in headers — sync our tracker
    const remaining = res.headers.get("x-ratelimit-requests-remaining");
    if (remaining != null) {
      const serverRemaining = parseInt(remaining, 10);
      if (!isNaN(serverRemaining)) {
        dailyCount = DAILY_LIMIT - serverRemaining;
      }
    }

    if (json.errors && Object.keys(json.errors).length > 0) {
      console.error("[API-Football] API errors:", JSON.stringify(json.errors));
      return null;
    }

    return json as T;
  } catch (err: any) {
    if (err.name === "TimeoutError") {
      console.error(`[API-Football] Timeout on ${endpoint}`);
    } else {
      console.error(`[API-Football] Fetch error on ${endpoint}:`, err.message);
    }
    return null;
  }
}

// ── Public API endpoints ─────────────────────────────────────────────────────

/** Status / quota check — doesn't count against daily limit */
export async function getApiStatus(): Promise<any> {
  const url = new URL("/status", BASE_URL);
  const res = await fetch(url.toString(), { headers: { "x-apisports-key": API_KEY } });
  return res.ok ? res.json() : null;
}

export const getFixtures            = (league: number, season: number) =>
  apiGet("/fixtures", { league, season });

export const getFixtureById         = (id: number) =>
  apiGet("/fixtures", { id });

export const getFixturesByDate      = (date: string) =>
  apiGet("/fixtures", { date });

export const getLiveFixtures        = () =>
  apiGet("/fixtures", { live: "all" });

export const getFixtureEvents       = (fixtureId: number) =>
  apiGet("/fixtures/events", { fixture: fixtureId });

export const getFixtureLineups      = (fixtureId: number) =>
  apiGet("/fixtures/lineups", { fixture: fixtureId });

export const getFixtureStatistics   = (fixtureId: number) =>
  apiGet("/fixtures/statistics", { fixture: fixtureId });

export const getStandings           = (league: number, season: number) =>
  apiGet("/standings", { league, season });

export const getTopScorers          = (league: number, season: number) =>
  apiGet("/players/topscorers", { league, season });

export const getTopAssists          = (league: number, season: number) =>
  apiGet("/players/topassists", { league, season });

export const getTopYellowCards      = (league: number, season: number) =>
  apiGet("/players/topyellowcards", { league, season });

export const getTopRedCards         = (league: number, season: number) =>
  apiGet("/players/topredcards", { league, season });

export const getHeadToHead          = (t1: number, t2: number, last = 10) =>
  apiGet("/fixtures/headtohead", { h2h: `${t1}-${t2}`, last });

export const getInjuries            = (league: number, season: number) =>
  apiGet("/injuries", { league, season });

export const getTransfers           = (team: number) =>
  apiGet("/transfers", { team });

export const getTeamStatistics      = (team: number, league: number, season: number) =>
  apiGet("/teams/statistics", { team, league, season });

export const getPredictions         = (fixtureId: number) =>
  apiGet("/predictions", { fixture: fixtureId });

// ── Status helpers ───────────────────────────────────────────────────────────

export type MatchStatus = "upcoming" | "live" | "finished";

const LIVE_SHORT     = new Set(["1H","HT","2H","ET","BT","P","SUSP","INT","LIVE"]);
const FINISHED_SHORT = new Set(["FT","AET","PEN","WO","AWD","ABD"]);

export function mapApiStatus(short: string): MatchStatus {
  if (LIVE_SHORT.has(short))     return "live";
  if (FINISHED_SHORT.has(short)) return "finished";
  return "upcoming";
}

export function extractMinute(status: any): number | null {
  return status?.elapsed ?? null;
}
