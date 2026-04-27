/**
 * sync.ts — Scorepion data synchronisation engine
 *
 * Architecture:
 *   - Single source of truth: PostgreSQL
 *   - API-Football populates the DB (supports both FREE and PRO plans)
 *   - The Express API serves ONLY from DB — zero live API calls in request path
 *
 * FREE plan (100 req/day, ~10 rpm) schedule:
 *   - 3 leagues only (PL, La Liga, Serie A)
 *   - Fixtures: once on startup + every 12h = ~6 calls/day
 *   - Standings: once on startup + every 12h = ~6 calls/day
 *   - Top scorers: once on startup + every 24h = ~3 calls/day
 *   - Settlement: every 2h (DB-only, no API calls)
 *   - NO live polling (too expensive)
 *   - NO injuries, cards, enrichment
 *   - Total: ~15-25 calls/day (well under 100 limit)
 *
 * PRO plan (7,500 req/day, 300 rpm) schedule:
 *   - All 21 leagues
 *   - Live polling every 30s when live games exist (near-realtime)
 *   - Fixtures every 2h, Standings every 4h
 *   - Top scorers + assists every 6h, Cards + injuries every 12h
 *   - Post-match enrichment every 1h, Settlement every 30min
 *   - Weekly reset hourly check
 *   - Total: ~1,500-2,800 calls/day (well under 7,500 limit)
 */

import { db } from "../db";
import {
  footballLeagues,
  footballTeams,
  footballFixtures,
  footballStandings,
  footballTopScorers,
  footballTopAssists,
  footballTopYellowCards,
  footballTopRedCards,
  footballInjuries,
  footballTransfers,
  footballFixtureEvents,
  footballFixtureLineups,
  footballFixtureStats,
  footballH2H,
  footballTeamStats,
  syncLog,
  groups,
  users,
  predictions,
} from "@shared/schema";
import { eq, and, gte, lte, isNull, ne, inArray, desc, sql } from "drizzle-orm";
import * as api from "./football-api";
import { SCORING } from "../config";
import { recordSyncTimestamp } from "../routes/health.routes";
import { sendSettlementPush, sendKickoffReminder, sendStreakAtRiskPush } from "./push.service";

export const LEAGUE_IDS = api.LEAGUE_MAP;
const CURRENT_SEASON = 2025;

// ── Push notification dedup (in-memory Set, resets on server restart) ──────────
// Key: `${notificationType}:${userId}:${matchId}` or `${notificationType}:${userId}`
const sentNotifications = new Set<string>();
const SENT_NOTIFICATIONS_MAX = 10_000;

function makeNotificationKey(type: string, userId: string, matchId?: string): string {
  return `${type}:${userId}:${matchId || ""}`;
}

function hasSentNotification(type: string, userId: string, matchId?: string): boolean {
  return sentNotifications.has(makeNotificationKey(type, userId, matchId));
}

function markNotificationSent(type: string, userId: string, matchId?: string): void {
  // Prevent unbounded memory growth: clear the entire set when it gets too large.
  // A full clear is acceptable because the worst-case consequence is a duplicate
  // push notification, which is harmless.
  if (sentNotifications.size >= SENT_NOTIFICATIONS_MAX) {
    console.log(
      `[Notifications] sentNotifications Set reached ${SENT_NOTIFICATIONS_MAX} entries, clearing`,
    );
    sentNotifications.clear();
  }
  sentNotifications.add(makeNotificationKey(type, userId, matchId));
}

// ── League and team seeding ──────────────────────────────────────────────────

export async function seedLeagues(): Promise<void> {
  for (const [localId, cfg] of Object.entries(api.LEAGUE_MAP)) {
    const logoUrl = `https://media.api-sports.io/football/leagues/${cfg.apiId}.png`;
    const flagUrl = `https://media.api-sports.io/flags/${cfg.country.toLowerCase().replace(/\s+/g, "_")}.svg`;
    await db
      .insert(footballLeagues)
      .values({
        id: localId,
        apiFootballId: cfg.apiId,
        name: cfg.name,
        country: cfg.country,
        logo: logoUrl,
        flag: flagUrl,
        color: cfg.color,
        icon: cfg.icon,
        season: cfg.season,
        type: cfg.type,
      })
      .onConflictDoUpdate({
        target: footballLeagues.id,
        set: {
          name: cfg.name,
          country: cfg.country,
          logo: logoUrl,
          flag: flagUrl,
          color: cfg.color,
          icon: cfg.icon,
          season: cfg.season,
          type: cfg.type,
        },
      });
  }
  console.log("[Sync] Leagues seeded:", Object.keys(api.LEAGUE_MAP).length);
}

// ── Default public groups per league ────────────────────────────────────────

const LEAGUE_GROUP_NAMES: Record<string, { name: string; code: string }> = {
  pl: { name: "Premier League Fans", code: "PLFC01" },
  la: { name: "La Liga Lovers", code: "LALV02" },
  sa: { name: "Serie A Squad", code: "SRSQ05" },
  bl: { name: "Bundesliga Buzz", code: "BLBZ06" },
  l1: { name: "Ligue 1 Club", code: "L1CL07" },
  tsl: { name: "Süper Lig Fans", code: "TSLF08" },
  ucl: { name: "UCL Predictions", code: "UCLP03" },
  uel: { name: "Europa League Hub", code: "UELH04" },
  uce: { name: "Conference League", code: "UCEF09" },
};

export async function seedLeagueGroups(): Promise<void> {
  let [systemUser] = await db.select().from(users).where(eq(users.username, "scorepion_system"));
  if (!systemUser) {
    [systemUser] = await db
      .insert(users)
      .values({
        username: "scorepion_system",
        password: "SYSTEM_NO_LOGIN",
        avatar: "",
      })
      .returning();
  }

  for (const [leagueId, info] of Object.entries(LEAGUE_GROUP_NAMES)) {
    await db
      .insert(groups)
      .values({
        name: info.name,
        code: info.code,
        isPublic: true,
        memberCount: 0,
        leagueIds: [leagueId],
        createdBy: systemUser.id,
        createdAt: Date.now(),
      })
      .onConflictDoNothing();
  }
  console.log("[Sync] League groups seeded");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function upsertTeamValues(t: any) {
  return {
    apiFootballId: t.id,
    name: t.name,
    shortName: (t.code || t.name.substring(0, 3)).toUpperCase(),
    logo: t.logo ?? "",
    color: t.color || "#333",
  };
}

async function logSync(
  type: string,
  leagueId: string | null,
  requests: number,
  status: string,
  error?: string,
) {
  try {
    await db.insert(syncLog).values({
      syncType: type,
      leagueId,
      requestCount: requests,
      status,
      error,
      syncedAt: Date.now(),
    });
  } catch {}
}

async function getLastSyncTime(syncType: string, leagueId?: string): Promise<number | null> {
  const q = db
    .select({ syncedAt: syncLog.syncedAt })
    .from(syncLog)
    .where(
      leagueId
        ? and(
            eq(syncLog.syncType, syncType),
            eq(syncLog.leagueId, leagueId),
            eq(syncLog.status, "success"),
          )
        : and(eq(syncLog.syncType, syncType), eq(syncLog.status, "success")),
    )
    .orderBy(desc(syncLog.syncedAt))
    .limit(1);
  const rows = await q;
  return rows[0]?.syncedAt ?? null;
}

async function shouldSync(
  syncType: string,
  intervalMs: number,
  leagueId?: string,
): Promise<boolean> {
  const last = await getLastSyncTime(syncType, leagueId);
  if (!last) return true;
  return Date.now() - last >= intervalMs;
}

// ── Fixture sync ─────────────────────────────────────────────────────────────

export async function syncFixturesForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;

  const data = await api.getFixtures(cfg.apiId, cfg.season);
  if (!data?.response) return 0;

  let count = 0;
  for (const f of data.response) {
    await db.insert(footballTeams).values(upsertTeamValues(f.teams.home)).onConflictDoNothing();
    await db.insert(footballTeams).values(upsertTeamValues(f.teams.away)).onConflictDoNothing();

    const values = {
      apiFixtureId: f.fixture.id,
      leagueId: localId,
      homeTeamId: f.teams.home.id,
      awayTeamId: f.teams.away.id,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status: api.mapApiStatus(f.fixture.status.short),
      statusShort: f.fixture.status.short,
      minute: api.extractMinute(f.fixture.status),
      kickoff: f.fixture.date,
      venue: f.fixture.venue?.name ?? "",
      referee: f.fixture.referee ?? "",
      round: f.league.round ?? "",
      season: cfg.season,
      updatedAt: Date.now(),
    };

    await db
      .insert(footballFixtures)
      .values(values)
      .onConflictDoUpdate({
        target: footballFixtures.apiFixtureId,
        set: { ...values },
      });
    count++;
  }

  await logSync("fixtures", localId, 1, "success");
  console.log(`[Sync] fixtures ${localId}: ${count}`);
  return count;
}

// ── Live score sync (called every 60s when live games exist) ─────────────────

export async function syncLiveScores(): Promise<number> {
  const data = await api.getLiveFixtures();
  if (!data?.response) return 0;

  const ourIds = new Set(Object.values(api.LEAGUE_MAP).map((l) => l.apiId));
  let count = 0;

  for (const f of data.response) {
    if (!ourIds.has(f.league.id)) continue;

    await db
      .update(footballFixtures)
      .set({
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        status: api.mapApiStatus(f.fixture.status.short),
        statusShort: f.fixture.status.short,
        minute: api.extractMinute(f.fixture.status),
        updatedAt: Date.now(),
      })
      .where(eq(footballFixtures.apiFixtureId, f.fixture.id));

    // Sync events for live match too
    await syncFixtureEventsById(f.fixture.id);
    count++;
  }

  if (count > 0) await logSync("live_scores", null, 1 + count, "success");
  console.log(`[Sync] live: ${count} fixtures updated`);
  return count;
}

// ── Post-match: events, lineups, stats ───────────────────────────────────────

export async function syncFixtureEventsById(fixtureApiId: number): Promise<void> {
  const data = await api.getFixtureEvents(fixtureApiId);
  if (!data?.response) return;

  for (const e of data.response) {
    await db
      .insert(footballFixtureEvents)
      .values({
        fixtureId: fixtureApiId,
        teamId: e.team.id,
        playerId: e.player?.id ?? null,
        playerName: e.player?.name ?? "",
        assistId: e.assist?.id ?? null,
        assistName: e.assist?.name ?? "",
        type: e.type,
        detail: e.detail ?? "",
        comments: e.comments ?? "",
        elapsed: e.time.elapsed,
        extraTime: e.time.extra ?? null,
        updatedAt: Date.now(),
      })
      .onConflictDoNothing();
  }
}

export async function syncFixtureLineupsById(fixtureApiId: number): Promise<void> {
  const data = await api.getFixtureLineups(fixtureApiId);
  if (!data?.response) return;

  for (const teamLineup of data.response) {
    const formation = teamLineup.formation ?? "";

    for (const p of teamLineup.startXI ?? []) {
      await db
        .insert(footballFixtureLineups)
        .values({
          fixtureId: fixtureApiId,
          teamId: teamLineup.team.id,
          formation,
          playerId: p.player.id,
          playerName: p.player.name,
          playerNumber: p.player.number ?? null,
          playerPos: p.player.pos ?? "",
          grid: p.player.grid ?? "",
          isStarting: true,
          updatedAt: Date.now(),
        })
        .onConflictDoNothing();
    }

    for (const p of teamLineup.substitutes ?? []) {
      await db
        .insert(footballFixtureLineups)
        .values({
          fixtureId: fixtureApiId,
          teamId: teamLineup.team.id,
          formation,
          playerId: p.player.id,
          playerName: p.player.name,
          playerNumber: p.player.number ?? null,
          playerPos: p.player.pos ?? "",
          grid: null,
          isStarting: false,
          updatedAt: Date.now(),
        })
        .onConflictDoNothing();
    }
  }
}

export async function syncFixtureStatsById(fixtureApiId: number): Promise<void> {
  const data = await api.getFixtureStatistics(fixtureApiId);
  if (!data?.response) return;

  const stat = (arr: any[], type: string) => {
    const found = arr?.find((s: any) => s.type === type);
    const v = found?.value;
    if (v == null || v === null) return null;
    if (typeof v === "string" && v.endsWith("%")) return parseInt(v, 10);
    return typeof v === "number" ? v : parseInt(v, 10) || null;
  };

  for (const team of data.response) {
    const s = team.statistics;
    await db
      .insert(footballFixtureStats)
      .values({
        fixtureId: fixtureApiId,
        teamId: team.team.id,
        shotsOnGoal: stat(s, "Shots on Goal"),
        shotsTotal: stat(s, "Total Shots"),
        blockedShots: stat(s, "Blocked Shots"),
        shotsInsideBox: stat(s, "Shots insidebox"),
        shotsOutsideBox: stat(s, "Shots outsidebox"),
        fouls: stat(s, "Fouls"),
        cornerKicks: stat(s, "Corner Kicks"),
        offsides: stat(s, "Offsides"),
        ballPossession: stat(s, "Ball Possession"),
        yellowCards: stat(s, "Yellow Cards"),
        redCards: stat(s, "Red Cards"),
        goalkeeperSaves: stat(s, "Goalkeeper Saves"),
        totalPasses: stat(s, "Total passes"),
        accuratePasses: stat(s, "Passes accurate"),
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: [footballFixtureStats.fixtureId, footballFixtureStats.teamId],
        set: {
          shotsOnGoal: stat(s, "Shots on Goal"),
          shotsTotal: stat(s, "Total Shots"),
          blockedShots: stat(s, "Blocked Shots"),
          shotsInsideBox: stat(s, "Shots insidebox"),
          shotsOutsideBox: stat(s, "Shots outsidebox"),
          fouls: stat(s, "Fouls"),
          cornerKicks: stat(s, "Corner Kicks"),
          offsides: stat(s, "Offsides"),
          ballPossession: stat(s, "Ball Possession"),
          yellowCards: stat(s, "Yellow Cards"),
          redCards: stat(s, "Red Cards"),
          goalkeeperSaves: stat(s, "Goalkeeper Saves"),
          totalPasses: stat(s, "Total passes"),
          accuratePasses: stat(s, "Passes accurate"),
          updatedAt: Date.now(),
        },
      });
  }
}

// ── Standings ────────────────────────────────────────────────────────────────

export async function syncStandingsForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;

  const data = await api.getStandings(cfg.apiId, cfg.season);
  if (!data?.response?.[0]?.league?.standings) return 0;

  const leagueData = data.response[0].league;

  await db
    .delete(footballStandings)
    .where(and(eq(footballStandings.leagueId, localId), eq(footballStandings.season, cfg.season)));

  let count = 0;
  for (const group of leagueData.standings) {
    for (const row of group) {
      await db.insert(footballTeams).values(upsertTeamValues(row.team)).onConflictDoNothing();

      await db.insert(footballStandings).values({
        leagueId: localId,
        teamId: row.team.id,
        position: row.rank,
        played: row.all.played,
        won: row.all.win,
        drawn: row.all.draw,
        lost: row.all.lose,
        goalsFor: row.all.goals.for,
        goalsAgainst: row.all.goals.against,
        goalDifference: row.goalsDiff,
        points: row.points,
        form: row.form ?? "",
        season: cfg.season,
        group: row.group ?? null,
        updatedAt: Date.now(),
      });
      count++;
    }
  }

  await logSync("standings", localId, 1, "success");
  console.log(`[Sync] standings ${localId}: ${count} rows`);
  return count;
}

// ── Top players ──────────────────────────────────────────────────────────────

export async function syncTopScorersForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;

  const data = await api.getTopScorers(cfg.apiId, cfg.season);
  if (!data?.response) return 0;

  await db
    .delete(footballTopScorers)
    .where(
      and(eq(footballTopScorers.leagueId, localId), eq(footballTopScorers.season, cfg.season)),
    );

  let count = 0;
  for (const e of data.response.slice(0, 20)) {
    const pl = e.player;
    const st = e.statistics[0];
    await db.insert(footballTeams).values(upsertTeamValues(st.team)).onConflictDoNothing();
    await db.insert(footballTopScorers).values({
      leagueId: localId,
      playerId: pl.id,
      playerName: pl.name,
      playerPhoto: pl.photo ?? "",
      teamId: st.team.id,
      goals: st.goals.total ?? 0,
      assists: st.goals.assists ?? 0,
      matches: st.games.appearences ?? 0,
      season: cfg.season,
      updatedAt: Date.now(),
    });
    count++;
  }

  await logSync("top_scorers", localId, 1, "success");
  return count;
}

export async function syncTopAssistsForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;
  const data = await api.getTopAssists(cfg.apiId, cfg.season);
  if (!data?.response) return 0;

  await db
    .delete(footballTopAssists)
    .where(
      and(eq(footballTopAssists.leagueId, localId), eq(footballTopAssists.season, cfg.season)),
    );

  let count = 0;
  for (const e of data.response.slice(0, 20)) {
    const pl = e.player;
    const st = e.statistics[0];
    await db.insert(footballTeams).values(upsertTeamValues(st.team)).onConflictDoNothing();
    await db.insert(footballTopAssists).values({
      leagueId: localId,
      playerId: pl.id,
      playerName: pl.name,
      playerPhoto: pl.photo ?? "",
      teamId: st.team.id,
      assists: st.goals.assists ?? 0,
      goals: st.goals.total ?? 0,
      matches: st.games.appearences ?? 0,
      season: cfg.season,
      updatedAt: Date.now(),
    });
    count++;
  }
  await logSync("top_assists", localId, 1, "success");
  return count;
}

export async function syncTopYellowCardsForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;
  const data = await api.getTopYellowCards(cfg.apiId, cfg.season);
  if (!data?.response) return 0;

  await db
    .delete(footballTopYellowCards)
    .where(
      and(
        eq(footballTopYellowCards.leagueId, localId),
        eq(footballTopYellowCards.season, cfg.season),
      ),
    );
  let count = 0;
  for (const e of data.response.slice(0, 20)) {
    const pl = e.player;
    const st = e.statistics[0];
    await db.insert(footballTeams).values(upsertTeamValues(st.team)).onConflictDoNothing();
    await db.insert(footballTopYellowCards).values({
      leagueId: localId,
      playerId: pl.id,
      playerName: pl.name,
      playerPhoto: pl.photo ?? "",
      teamId: st.team.id,
      yellowCards: st.cards.yellow ?? 0,
      matches: st.games.appearences ?? 0,
      season: cfg.season,
      updatedAt: Date.now(),
    });
    count++;
  }
  await logSync("top_yellow_cards", localId, 1, "success");
  return count;
}

export async function syncTopRedCardsForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;
  const data = await api.getTopRedCards(cfg.apiId, cfg.season);
  if (!data?.response) return 0;

  await db
    .delete(footballTopRedCards)
    .where(
      and(eq(footballTopRedCards.leagueId, localId), eq(footballTopRedCards.season, cfg.season)),
    );
  let count = 0;
  for (const e of data.response.slice(0, 20)) {
    const pl = e.player;
    const st = e.statistics[0];
    await db.insert(footballTeams).values(upsertTeamValues(st.team)).onConflictDoNothing();
    await db.insert(footballTopRedCards).values({
      leagueId: localId,
      playerId: pl.id,
      playerName: pl.name,
      playerPhoto: pl.photo ?? "",
      teamId: st.team.id,
      redCards: st.cards.red ?? 0,
      matches: st.games.appearences ?? 0,
      season: cfg.season,
      updatedAt: Date.now(),
    });
    count++;
  }
  await logSync("top_red_cards", localId, 1, "success");
  return count;
}

// ── Injuries ─────────────────────────────────────────────────────────────────

export async function syncInjuriesForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;
  const data = await api.getInjuries(cfg.apiId, cfg.season);
  if (!data?.response) return 0;

  await db
    .delete(footballInjuries)
    .where(and(eq(footballInjuries.leagueId, localId), eq(footballInjuries.season, cfg.season)));
  let count = 0;
  for (const e of data.response) {
    const pl = e.player;
    const team = e.team;
    await db.insert(footballTeams).values(upsertTeamValues(team)).onConflictDoNothing();
    await db.insert(footballInjuries).values({
      leagueId: localId,
      playerId: pl.id,
      playerName: pl.name,
      playerPhoto: pl.photo ?? "",
      teamId: team.id,
      type: pl.type ?? "Unknown",
      reason: pl.reason ?? "",
      fixtureId: e.fixture?.id ?? null,
      fixtureDate: e.fixture?.date ?? "",
      season: cfg.season,
      updatedAt: Date.now(),
    });
    count++;
  }
  await logSync("injuries", localId, 1, "success");
  return count;
}

// ── Transfers ────────────────────────────────────────────────────────────────
//
// API-Football's /transfers endpoint takes a team ID, not a league ID. To
// populate a full league's transfers, we iterate every team in that league's
// standings and aggregate their transfer windows.

export async function syncTransfersForLeague(localId: string): Promise<number> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return 0;

  // Get all teams in this league's standings
  const standings = await db
    .selectDistinct({ teamId: footballStandings.teamId })
    .from(footballStandings)
    .where(eq(footballStandings.leagueId, localId));

  if (!standings || standings.length === 0) return 0;

  const teamIds = standings.map((s) => s.teamId);
  let count = 0;

  for (const teamId of teamIds) {
    const data = await api.getTransfers(teamId);
    if (!data?.response) continue;

    for (const transfer of data.response) {
      const t = transfer.transfers?.[0]; // API returns transfers array; take first
      if (!t) continue;

      const id = `${teamId}-${t.date || Date.now()}`;
      await db
        .insert(footballTransfers)
        .values({
          id,
          leagueId: localId,
          playerId: transfer.player?.id ?? 0,
          playerName: transfer.player?.name ?? "",
          playerPhoto: transfer.player?.photo ?? "",
          teamInId: t.team?.id,
          teamInName: t.team?.name ?? "",
          teamInLogo: t.team?.logo ?? "",
          teamOutId: transfer.teams?.out?.id,
          teamOutName: transfer.teams?.out?.name ?? "",
          teamOutLogo: transfer.teams?.out?.logo ?? "",
          transferDate: t.date ?? "",
          transferType: t.type ?? "",
          season: cfg.season,
          updatedAt: Date.now(),
        })
        .onConflictDoNothing();
      count++;
    }
  }

  await logSync("transfers", localId, teamIds.length, "success");
  console.log(`[Sync] transfers ${localId}: ${count} rows across ${teamIds.length} teams`);
  return count;
}

// ── H2H ──────────────────────────────────────────────────────────────────────

export async function syncH2H(team1Id: number, team2Id: number): Promise<number> {
  const data = await api.getHeadToHead(team1Id, team2Id, 15);
  if (!data?.response) return 0;

  const t1 = Math.min(team1Id, team2Id);
  const t2 = Math.max(team1Id, team2Id);

  let count = 0;
  for (const f of data.response) {
    await db
      .insert(footballH2H)
      .values({
        team1Id: t1,
        team2Id: t2,
        fixtureId: f.fixture.id,
        leagueId: String(f.league.id ?? ""),
        leagueName: f.league.name ?? "",
        homeTeamId: f.teams.home.id,
        awayTeamId: f.teams.away.id,
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        status: api.mapApiStatus(f.fixture.status.short),
        kickoff: f.fixture.date,
        venue: f.fixture?.venue?.name ?? "",
        season: f.league.season ?? CURRENT_SEASON,
        updatedAt: Date.now(),
      })
      .onConflictDoNothing();
    count++;
  }
  return count;
}

// ── Team statistics ───────────────────────────────────────────────────────────

export async function syncTeamStatistics(teamId: number, localId: string): Promise<void> {
  const cfg = api.LEAGUE_MAP[localId];
  if (!cfg) return;

  const data = await api.getTeamStatistics(teamId, cfg.apiId, cfg.season);
  if (!data?.response) return;

  const r = data.response;
  await db
    .insert(footballTeamStats)
    .values({
      teamId,
      leagueId: localId,
      season: cfg.season,
      matchesPlayed: r.fixtures?.played?.total ?? 0,
      wins: r.fixtures?.wins?.total ?? 0,
      draws: r.fixtures?.draws?.total ?? 0,
      losses: r.fixtures?.loses?.total ?? 0,
      goalsFor: r.goals?.for?.total?.total ?? 0,
      goalsAgainst: r.goals?.against?.total?.total ?? 0,
      avgGoalsFor: String(r.goals?.for?.average?.total ?? "0"),
      avgGoalsAgainst: String(r.goals?.against?.average?.total ?? "0"),
      cleanSheets: r.clean_sheet?.total ?? 0,
      failedToScore: r.failed_to_score?.total ?? 0,
      longestWinStreak: r.biggest?.streak?.wins ?? 0,
      longestLoseStreak: r.biggest?.streak?.loses ?? 0,
      form: r.form ?? "",
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: [footballTeamStats.teamId, footballTeamStats.leagueId, footballTeamStats.season],
      set: { updatedAt: Date.now(), form: r.form ?? "" },
    });
}

// ── Post-match detail enrichment ─────────────────────────────────────────────
// Called 4h after a fixture reaches "finished" status.

export async function enrichFinishedFixtures(): Promise<number> {
  const { pool } = await import("../db");

  // Find finished fixtures that don't have events yet
  const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const pending = await pool.query(
    `
    SELECT DISTINCT f.api_fixture_id, f.home_team_id, f.away_team_id
    FROM football_fixtures f
    WHERE f.status = 'finished'
      AND f.kickoff >= $1
      AND f.kickoff < $2
      AND NOT EXISTS (
        SELECT 1 FROM football_fixture_events e WHERE e.fixture_id = f.api_fixture_id
      )
    LIMIT 10
  `,
    [oneDayAgo, fourHoursAgo],
  );

  let enriched = 0;
  for (const row of pending.rows) {
    if (!api.canMakeRequest() || api.getRemainingRequests() <= 50) break;

    const id = row.api_fixture_id;
    await syncFixtureEventsById(id);
    await syncFixtureLineupsById(id);
    await syncFixtureStatsById(id);
    enriched++;
  }

  if (enriched > 0) console.log(`[Sync] Enriched ${enriched} finished fixtures`);
  return enriched;
}

// ── Prediction settlement (unchanged from previous session) ──────────────────

export async function settlePredictions(): Promise<number> {
  const { pool } = await import("../db");
  const { checkAndAwardAchievements, getUserStats } = await import("./achievements.service");
  const { logGroupActivity } = await import("./group-activity.service");

  let settled = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Advisory lock prevents concurrent settlement runs (lock id = 1 for settlement)
    await client.query("SELECT pg_advisory_xact_lock(1)");

    // Fetch ALL unsettled predictions joined with their finished fixture data
    // in a single query at the start of the transaction, so we work with a
    // consistent snapshot and avoid per-row queries inside the loop.
    const unsettled = await client.query(`
      SELECT
        p.id, p.match_id, p.home_score AS pred_home, p.away_score AS pred_away, p.user_id,
        f.home_score AS act_home, f.away_score AS act_away,
        f.home_team_id, f.away_team_id
      FROM predictions p
      JOIN football_fixtures f
        ON CAST(f.api_fixture_id AS TEXT) = p.match_id
        AND f.status = 'finished'
        AND f.home_score IS NOT NULL
        AND f.away_score IS NOT NULL
      WHERE p.settled = false
    `);

    if (unsettled.rows.length === 0) {
      await client.query("COMMIT");
      return 0;
    }

    for (const row of unsettled.rows) {
      const actHome = row.act_home;
      const actAway = row.act_away;
      const predHome = row.pred_home;
      const predAway = row.pred_away;

      // Scoring tiers
      let basePts = 0;
      const isExact = predHome === actHome && predAway === actAway;
      if (isExact) {
        basePts = SCORING.EXACT_SCORE_POINTS;
      } else {
        const pR = predHome > predAway ? "H" : predHome < predAway ? "A" : "D";
        const aR = actHome > actAway ? "H" : actHome < actAway ? "A" : "D";
        const pGD = predHome - predAway;
        const aGD = actHome - actAway;
        if (pR === aR) {
          basePts = pGD === aGD ? SCORING.CORRECT_RESULT_WITH_GD : SCORING.CORRECT_RESULT;
        } else if (pGD === aGD) {
          basePts = SCORING.GOAL_DIFFERENCE_ONLY;
        } else if (Math.abs(predHome + predAway - (actHome + actAway)) <= 1) {
          basePts = SCORING.TOTAL_GOALS_CLOSE;
        }
      }

      // Upset bonus
      let upsetBonus = 0;
      if (basePts >= 5 && !isExact) {
        try {
          const stg = await client.query(
            `SELECT team_id, position FROM football_standings WHERE team_id IN ($1,$2) ORDER BY position ASC LIMIT 2`,
            [row.home_team_id, row.away_team_id],
          );
          if (stg.rows.length === 2) {
            const fav = stg.rows[0].team_id;
            const aRes = actHome > actAway ? "home" : actHome < actAway ? "away" : "draw";
            const pRes = predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";
            const udWon =
              (aRes === "away" && fav === row.home_team_id) ||
              (aRes === "home" && fav === row.away_team_id);
            if (udWon && pRes === aRes) upsetBonus = SCORING.UPSET_BONUS;
          }
        } catch (err) {
          console.error(`[Settlement] Error computing upset bonus for prediction ${row.id}:`, err);
        }
      }
      basePts += upsetBonus;

      // Boost
      let pts = basePts;
      const boost = await client.query(
        `SELECT id, multiplier FROM boost_picks WHERE user_id=$1 AND match_id=$2 AND settled=false`,
        [row.user_id, row.match_id],
      );
      const isBoosted = boost.rows.length > 0;
      if (isBoosted && basePts > 0) {
        pts = basePts * (boost.rows[0].multiplier || 2);
        await client.query(
          `UPDATE boost_picks SET settled=true,original_points=$1,boosted_points=$2 WHERE user_id=$3 AND match_id=$4`,
          [basePts, pts, row.user_id, row.match_id],
        );
      } else if (isBoosted) {
        await client.query(
          `UPDATE boost_picks SET settled=true,original_points=0,boosted_points=0 WHERE user_id=$1 AND match_id=$2`,
          [row.user_id, row.match_id],
        );
      }

      await client.query(`UPDATE predictions SET points=$1,settled=true WHERE id=$2`, [
        pts,
        row.id,
      ]);
      if (pts > 0) {
        await client.query(
          `UPDATE users SET total_points=total_points+$1,weekly_points=weekly_points+$1,monthly_points=monthly_points+$1 WHERE id=$2`,
          [pts, row.user_id],
        );
      }
      if (basePts >= 5) {
        await client.query(
          `UPDATE users SET correct_predictions=correct_predictions+1,streak=streak+1,best_streak=GREATEST(best_streak,streak+1) WHERE id=$1`,
          [row.user_id],
        );
      } else {
        await client.query(`UPDATE users SET streak=0 WHERE id=$1 AND streak>0`, [row.user_id]);
      }

      // Send settlement push notification (with dedup)
      try {
        if (!hasSentNotification("settlement", row.user_id, row.match_id)) {
          const teamQuery = await client.query(
            `SELECT ht.name as home_name, at.name as away_name FROM football_teams ht
           JOIN football_teams at ON true
           WHERE ht.api_football_id=$1 AND at.api_football_id=$2`,
            [row.home_team_id, row.away_team_id],
          );
          const teamName = teamQuery.rows[0] || { home_name: "Home", away_name: "Away" };
          const matchSummary = `${teamName.home_name} ${actHome}-${actAway} ${teamName.away_name}`;
          await sendSettlementPush(row.user_id, pts, matchSummary, row.match_id);
          markNotificationSent("settlement", row.user_id, row.match_id);
        }
      } catch (err) {
        console.error(`[Settlement] Error sending push notification for user ${row.user_id}:`, err);
      }

      // Group activity + achievements
      try {
        if (pts > 0) {
          await logGroupActivity(
            client,
            row.user_id,
            isExact ? "exact_score" : "points_earned",
            {
              predicted: `${predHome}-${predAway}`,
              actual: `${actHome}-${actAway}`,
              points: pts,
              boosted: isBoosted,
              upsetBonus,
            },
            row.match_id,
            pts,
          );
        }
        const { streak } = await client
          .query(`SELECT streak FROM users WHERE id=$1`, [row.user_id])
          .then((r) => r.rows[0] ?? {});
        if ((SCORING.STREAK_MILESTONES as readonly number[]).includes(Number(streak))) {
          await logGroupActivity(client, row.user_id, "streak", { streak }, undefined, 0);
        }
      } catch (err) {
        console.error(`[Settlement] Error logging group activity for user ${row.user_id}:`, err);
      }

      try {
        const stats = await getUserStats(client, row.user_id);
        const newAchs = await checkAndAwardAchievements(client, row.user_id, stats);
        for (const a of newAchs) {
          await logGroupActivity(client, row.user_id, "achievement", {
            type: a.type,
            title: a.title,
          });
        }
      } catch (err) {
        console.error(`[Settlement] Error awarding achievements for user ${row.user_id}:`, err);
      }

      settled++;
    }

    if (settled > 0) {
      // Recompute global ranks (within transaction)
      await client.query(`
        UPDATE users u SET rank=sub.new_rank
        FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) AS new_rank FROM users) sub
        WHERE u.id=sub.id
      `);
    }

    await client.query("COMMIT");
    console.log(`[Settlement] ${settled} predictions settled`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[Settlement] Transaction failed, rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
  return settled;
}

// ── Weekly reset ──────────────────────────────────────────────────────────────

async function cronWeeklyReset(): Promise<void> {
  const { pool } = await import("../db");
  const now = new Date();
  if (now.getUTCDay() !== 1) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Advisory lock prevents concurrent weekly reset runs (lock id = 2 for weekly reset)
    await client.query("SELECT pg_advisory_xact_lock(2)");

    // Guard: check if we already ran the reset this week by looking for a
    // weekly_winners row with this Monday's date. If it exists, skip.
    const weekStart = now.toISOString().split("T")[0];
    const alreadyRan = await client.query(
      `SELECT 1 FROM weekly_winners WHERE week_start=$1 AND type='global' LIMIT 1`,
      [weekStart],
    );
    if (alreadyRan.rows.length > 0) {
      await client.query("COMMIT");
      console.log(`[Cron] Weekly reset already ran for ${weekStart}, skipping`);
      return;
    }

    // Snapshot top 3 weekly performers BEFORE resetting points
    const top = await client.query(
      `SELECT id, weekly_points FROM users ORDER BY weekly_points DESC LIMIT 3`,
    );

    const { logGroupActivity } = await import("./group-activity.service");
    for (let i = 0; i < top.rows.length; i++) {
      const u = top.rows[i];
      if (u.weekly_points > 0) {
        await client.query(
          `INSERT INTO weekly_winners(user_id,week_start,points,rank,type) VALUES($1,$2,$3,$4,'global') ON CONFLICT DO NOTHING`,
          [u.id, weekStart, u.weekly_points, i + 1],
        );
        await logGroupActivity(client, u.id, "weekly_winner", {
          rank: i + 1,
          points: u.weekly_points,
        });
      }
    }

    // Atomically copy rank to rank_last_week AND reset weekly_points in a single UPDATE
    await client.query(`UPDATE users SET rank_last_week = rank, weekly_points = 0`);

    // Monthly reset on the 1st of the month
    if (now.getUTCDate() === 1) {
      await client.query(`UPDATE users SET monthly_points = 0`);
    }

    await client.query("COMMIT");
    console.log(`[Cron] Weekly reset complete`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[Cron] Weekly reset transaction failed, rolled back:", err);
    throw err;
  } finally {
    client.release();
  }
}

// ── Cron helpers ──────────────────────────────────────────────────────────────

async function hasLiveFixtures(): Promise<boolean> {
  const { pool } = await import("../db");
  const r = await pool.query(`SELECT 1 FROM football_fixtures WHERE status='live' LIMIT 1`);
  return r.rows.length > 0;
}

// ── Live polling ──────────────────────────────────────────────────────────────

let liveInterval: ReturnType<typeof setInterval> | null = null;

export function startLivePolling(intervalMs = 60_000): void {
  if (liveInterval) return;
  liveInterval = setInterval(async () => {
    try {
      if (
        (await hasLiveFixtures()) ||
        (await api.getLiveFixtures().then((d) => (d?.response?.length ?? 0) > 0))
      ) {
        const n = await syncLiveScores();
        if (n > 0) await settlePredictions();
      }
    } catch (err) {
      console.error("[LivePoll] error:", err);
    }
  }, intervalMs);
  console.log(`[LivePoll] started (${intervalMs / 1000}s interval)`);
}

export function stopLivePolling(): void {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = null;
  }
}

// ── Cron scheduler ────────────────────────────────────────────────────────────

const SIX_H = 6 * 60 * 60 * 1000;
const TWELVE_H = 12 * 60 * 60 * 1000;
const DAY_H = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const INIT_DELAY = 30_000;

let cronIntervals: ReturnType<typeof setInterval>[] = [];
let initTimeout: ReturnType<typeof setTimeout> | null = null;

// Spread league syncs to avoid burst — stagger by 8s per league
async function runForAllLeagues(
  fn: (id: string) => Promise<number>,
  label: string,
  filterPriority?: 1 | 2 | 3,
): Promise<number> {
  let total = 0;
  const activeIds = new Set(api.getActiveLeagueIds());
  const minRemaining = api.getApiPlan() === "free" ? 15 : 100;

  const leagues = Object.entries(api.LEAGUE_MAP)
    .filter(([id, cfg]) => activeIds.has(id) && (!filterPriority || cfg.priority <= filterPriority))
    .map(([id]) => id);

  for (const id of leagues) {
    if (api.getRemainingRequests() <= minRemaining) {
      console.warn(`[Cron] Low quota (${api.getRemainingRequests()} left), stopping ${label}`);
      break;
    }
    try {
      total += await fn(id);
    } catch (err: any) {
      console.error(`[Cron] ${label} failed for ${id}:`, err.message);
    }
  }
  return total;
}

/**
 * Send kickoff reminder notifications to users with predictions on fixtures
 * that will kick off in 25-35 minutes. Runs every 10 minutes (PRO plan only).
 */
async function sendKickoffReminders(): Promise<void> {
  try {
    const now = Date.now();
    const minTime = now + 25 * 60 * 1000; // 25 minutes from now
    const maxTime = now + 35 * 60 * 1000; // 35 minutes from now

    const fixtures = await db
      .select({
        apiFixtureId: footballFixtures.apiFixtureId,
        homeTeamId: footballFixtures.homeTeamId,
        awayTeamId: footballFixtures.awayTeamId,
      })
      .from(footballFixtures)
      .where(
        and(
          eq(footballFixtures.status, "upcoming"),
          gte(
            sql`EXTRACT(EPOCH FROM ${footballFixtures.kickoff}::timestamp) * 1000`,
            minTime / 1000,
          ),
          lte(
            sql`EXTRACT(EPOCH FROM ${footballFixtures.kickoff}::timestamp) * 1000`,
            maxTime / 1000,
          ),
        ),
      );

    for (const fixture of fixtures) {
      // Find all users with predictions on this fixture (use Set to deduplicate)
      const predResults = await db
        .select({ userId: predictions.userId })
        .from(predictions)
        .where(eq(predictions.matchId, fixture.apiFixtureId.toString()));

      const uniqueUserIds = Array.from(new Set(predResults.map((p) => p.userId))).map((userId) => ({
        userId,
      }));
      const preds = uniqueUserIds;

      // Fetch team names
      const homeTeams = await db
        .select({ name: footballTeams.name })
        .from(footballTeams)
        .where(eq(footballTeams.apiFootballId, fixture.homeTeamId));

      const awayTeams = await db
        .select({ name: footballTeams.name })
        .from(footballTeams)
        .where(eq(footballTeams.apiFootballId, fixture.awayTeamId));

      const homeTeam = homeTeams[0]?.name || "Home";
      const awayTeam = awayTeams[0]?.name || "Away";

      for (const pred of preds) {
        if (!hasSentNotification("kickoff", pred.userId, fixture.apiFixtureId.toString())) {
          await sendKickoffReminder(
            pred.userId,
            homeTeam,
            awayTeam,
            fixture.apiFixtureId.toString(),
          );
          markNotificationSent("kickoff", pred.userId, fixture.apiFixtureId.toString());
        }
      }
    }
  } catch (err) {
    console.error("[Notifications] Kickoff reminder error:", err);
  }
}

/**
 * Send streak-at-risk notifications at 21:00 UTC daily.
 * Targets users with streak > 0 who have zero predictions today.
 */
async function sendStreakAtRiskReminders(): Promise<void> {
  try {
    // Check if it's around 21:00 UTC (run with 30-min window to avoid timing issues)
    const now = new Date();
    const utcHour = now.getUTCHours();
    if (utcHour !== 21) return; // Only run at 21:00 UTC

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    // Find users with streak > 0 and zero predictions since today midnight UTC
    const usersAtRisk = await db
      .select({
        userId: users.id,
        streak: users.streak,
      })
      .from(users)
      .where(and(ne(users.streak, 0)));

    for (const user of usersAtRisk) {
      const predCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(predictions)
        .where(and(eq(predictions.userId, user.userId), gte(predictions.timestamp, todayStart)));

      const hasPredictionToday = Number(predCount[0]?.count ?? 0) > 0;

      if (!hasPredictionToday && !hasSentNotification("streak_at_risk", user.userId)) {
        await sendStreakAtRiskPush(user.userId, user.streak || 0);
        markNotificationSent("streak_at_risk", user.userId);
      }
    }
  } catch (err) {
    console.error("[Notifications] Streak-at-risk error:", err);
  }
}

export function startCronScheduler(): void {
  const plan = api.getApiPlan();
  const limit = api.getDailyLimit();
  const rate = api.getRateLimit();
  console.log(
    `[Cron] Initialising scheduler (${plan.toUpperCase()} plan — ${limit} req/day, ${rate.rpm} rpm)`,
  );
  console.log(`[Cron] Active leagues: ${api.getActiveLeagueIds().join(", ")}`);

  initTimeout = setTimeout(async () => {
    console.log("[Cron] Running initial sync...");
    try {
      // Resolve each league's currently-active season from API-Football
      // BEFORE any other sync runs, so fixtures/standings/etc. query the
      // right year. This updates LEAGUE_MAP in place; everything downstream
      // reads from that same map.
      await api.refreshLeagueSeasons();
      await seedLeagues();
      await runForAllLeagues(syncFixturesForLeague, "fixtures");
      await runForAllLeagues(syncStandingsForLeague, "standings");
      // Player leaderboards (goals/assists/yellows/reds) + injuries are now
      // part of the initial sync so the UI doesn't sit empty for 6-12 hours
      // waiting for the first cron tick. Priority-2 filter keeps it to ~8 leagues
      // on pro plan; the priority param is ignored on free plan (3-league cap).
      await runForAllLeagues(syncTopScorersForLeague, "top_scorers", 2);
      await runForAllLeagues(syncTopAssistsForLeague, "top_assists", 2);
      await runForAllLeagues(syncTopYellowCardsForLeague, "yellow_cards", 2);
      await runForAllLeagues(syncTopRedCardsForLeague, "red_cards", 2);
      await runForAllLeagues(syncInjuriesForLeague, "injuries", 2);
      await settlePredictions();
      recordSyncTimestamp();
      console.log(`[Cron] Initial sync complete (${api.getRequestCount()} requests used)`);
    } catch (err) {
      console.error("[Cron] Initial sync error:", err);
    }
  }, INIT_DELAY);

  if (plan === "free") {
    // ── FREE PLAN: Conservative schedule ──────────────────────────────────
    // Fixtures + standings: every 12h (3 leagues × 2 = 6 calls each run)
    cronIntervals.push(
      setInterval(async () => {
        try {
          await runForAllLeagues(syncFixturesForLeague, "fixtures");
          await settlePredictions();
          recordSyncTimestamp();
        } catch (err) {
          console.error("[Cron] Fixtures error:", err);
        }
      }, TWELVE_H),
    );

    cronIntervals.push(
      setInterval(async () => {
        try {
          await runForAllLeagues(syncStandingsForLeague, "standings");
        } catch (err) {
          console.error("[Cron] Standings error:", err);
        }
      }, TWELVE_H),
    );

    // Top scorers: once per day (3 calls)
    cronIntervals.push(
      setInterval(async () => {
        try {
          await runForAllLeagues(syncTopScorersForLeague, "scorers", 1);
        } catch (err) {
          console.error("[Cron] Scorers error:", err);
        }
      }, DAY_H),
    );

    // Settlement check: every 2h (no API calls, just DB)
    cronIntervals.push(
      setInterval(async () => {
        try {
          await settlePredictions();
        } catch (err) {
          console.error("[Cron] Settlement error:", err);
        }
      }, 2 * HOUR),
    );

    // Weekly reset: check every hour, run on Monday (no API calls)
    cronIntervals.push(
      setInterval(async () => {
        try {
          await cronWeeklyReset();
        } catch (err) {
          console.error("[Cron] Weekly reset error:", err);
        }
      }, HOUR),
    );

    // Re-resolve active seasons from API-Football every 24h so a server that
    // stays up across a season turnover (e.g. 2025-26 → 2026-27 in Aug 2026)
    // automatically picks up the new year without a redeploy.
    cronIntervals.push(
      setInterval(async () => {
        try {
          await api.refreshLeagueSeasons();
        } catch (err) {
          console.error("[Cron] Season refresh error:", err);
        }
      }, DAY_H),
    );

    // Kickoff reminder: every 15 minutes (lightweight, no API calls)
    cronIntervals.push(
      setInterval(
        async () => {
          try {
            await sendKickoffReminders();
          } catch (err) {
            console.error("[Cron] Kickoff reminder error:", err);
          }
        },
        15 * 60 * 1000,
      ),
    );

    // NO live polling, NO injuries, NO cards, NO enrichment on free plan
    console.log("[Cron] Free plan: live polling DISABLED, extended stats DISABLED");
  } else {
    // ── PRO PLAN: Aggressive schedule ─────────────────────────────────────
    // 300 rpm rate limit + 7,500 req/day budget.
    // 21 leagues × ~7 req/sync ≈ 150 req per full cycle.
    // Budget: live polling ~2,000/day + cron ~800/day = ~2,800 total.
    //
    // Fixtures: every 2h — keeps upcoming/finished statuses fresh.
    // Live scores are handled by the 30s live poller, not cron.
    const TWO_H = 2 * HOUR;

    cronIntervals.push(
      setInterval(async () => {
        try {
          await runForAllLeagues(syncFixturesForLeague, "fixtures");
          await settlePredictions();
        } catch (err) {
          console.error("[Cron] Fixtures error:", err);
        }
      }, TWO_H),
    );

    // Standings: every 4h (offset by 10min to spread load)
    const FOUR_H = 4 * HOUR;
    cronIntervals.push(
      setInterval(async () => {
        try {
          await new Promise((r) => setTimeout(r, 10 * 60 * 1000));
          await runForAllLeagues(syncStandingsForLeague, "standings");
        } catch (err) {
          console.error("[Cron] Standings error:", err);
        }
      }, FOUR_H),
    );

    // Top scorers + assists: every 6h
    cronIntervals.push(
      setInterval(async () => {
        try {
          await new Promise((r) => setTimeout(r, 20 * 60 * 1000));
          await runForAllLeagues(syncTopScorersForLeague, "scorers", 2);
          await runForAllLeagues(syncTopAssistsForLeague, "assists", 2);
        } catch (err) {
          console.error("[Cron] Scorers error:", err);
        }
      }, SIX_H),
    );

    // Cards: every 12h
    cronIntervals.push(
      setInterval(async () => {
        try {
          await new Promise((r) => setTimeout(r, 30 * 60 * 1000));
          await runForAllLeagues(syncTopYellowCardsForLeague, "yellow_cards", 2);
          await runForAllLeagues(syncTopRedCardsForLeague, "red_cards", 2);
        } catch (err) {
          console.error("[Cron] Cards error:", err);
        }
      }, TWELVE_H),
    );

    // Injuries: every 12h (was 24h — 300 rpm lets us refresh more often)
    cronIntervals.push(
      setInterval(async () => {
        try {
          await new Promise((r) => setTimeout(r, 40 * 60 * 1000));
          await runForAllLeagues(syncInjuriesForLeague, "injuries", 2);
        } catch (err) {
          console.error("[Cron] Injuries error:", err);
        }
      }, TWELVE_H),
    );

    // Transfers: every 24h (PRO plan only; ~21 leagues × ~20 teams = 420 calls total)
    cronIntervals.push(
      setInterval(async () => {
        try {
          await new Promise((r) => setTimeout(r, 50 * 60 * 1000));
          await runForAllLeagues(syncTransfersForLeague, "transfers", 2);
        } catch (err) {
          console.error("[Cron] Transfers error:", err);
        }
      }, DAY_H),
    );

    // Post-match enrichment (events, lineups, stats): every hour
    cronIntervals.push(
      setInterval(async () => {
        try {
          await enrichFinishedFixtures();
        } catch (err) {
          console.error("[Cron] Enrichment error:", err);
        }
      }, HOUR),
    );

    // Settlement: every 30min (no API calls, DB-only — fast with 300 rpm)
    cronIntervals.push(
      setInterval(
        async () => {
          try {
            await settlePredictions();
          } catch (err) {
            console.error("[Cron] Settlement error:", err);
          }
        },
        30 * 60 * 1000,
      ),
    );

    // Re-resolve active seasons from API-Football every 24h so a server that
    // stays up across a season turnover automatically picks up the new year.
    cronIntervals.push(
      setInterval(async () => {
        try {
          await api.refreshLeagueSeasons();
        } catch (err) {
          console.error("[Cron] Season refresh error:", err);
        }
      }, DAY_H),
    );

    // Kickoff reminder: every 10 minutes (pro plan only)
    // Find fixtures where kickoff is 25-35 minutes away AND user has a locked prediction
    cronIntervals.push(
      setInterval(
        async () => {
          try {
            await sendKickoffReminders();
          } catch (err) {
            console.error("[Cron] Kickoff reminder error:", err);
          }
        },
        10 * 60 * 1000,
      ),
    );

    // Streak-at-risk: once daily at 21:00 UTC
    // Find users with streak > 0 and zero predictions today, send nudge
    cronIntervals.push(
      setInterval(async () => {
        try {
          await sendStreakAtRiskReminders();
        } catch (err) {
          console.error("[Cron] Streak-at-risk error:", err);
        }
      }, DAY_H),
    );

    // Weekly reset: every hour
    cronIntervals.push(
      setInterval(async () => {
        try {
          await cronWeeklyReset();
        } catch (err) {
          console.error("[Cron] Weekly reset error:", err);
        }
      }, HOUR),
    );
  }

  console.log("[Cron] All jobs registered");
}

export function stopCronScheduler(): void {
  if (initTimeout) {
    clearTimeout(initTimeout);
    initTimeout = null;
  }
  cronIntervals.forEach(clearInterval);
  cronIntervals = [];
  console.log("[Cron] Scheduler stopped");
}

// Keep legacy exports for sync.service.ts
//
// syncAllData is what /api/football/sync/full calls. It now runs the full
// league-level refresh: fixtures + standings + all player leaderboards +
// injuries. This is what actually makes the admin "full sync" button do
// what its name implies.
export async function syncAllData() {
  const start = api.getRequestCount();
  const fixtures = await runForAllLeagues(syncFixturesForLeague, "fixtures");
  const standings = await runForAllLeagues(syncStandingsForLeague, "standings");
  const scorers = await runForAllLeagues(syncTopScorersForLeague, "scorers", 1);
  const assists = await runForAllLeagues(syncTopAssistsForLeague, "assists", 2);
  const yellowCards = await runForAllLeagues(syncTopYellowCardsForLeague, "yellow_cards", 2);
  const redCards = await runForAllLeagues(syncTopRedCardsForLeague, "red_cards", 2);
  const injuries = await runForAllLeagues(syncInjuriesForLeague, "injuries", 2);
  const transfers = await runForAllLeagues(syncTransfersForLeague, "transfers", 2);
  return {
    fixtures,
    standings,
    scorers,
    assists,
    yellowCards,
    redCards,
    injuries,
    transfers,
    requests: api.getRequestCount() - start,
  };
}

export { hasLiveFixtures };
export async function getSyncStatus() {
  const { pool } = await import("../db");
  return {
    dailyRequests: api.getRequestCount(),
    remaining: api.getRemainingRequests(),
    recentSyncs: (
      await pool.query(
        `SELECT sync_type,league_id,status,synced_at FROM sync_log ORDER BY synced_at DESC LIMIT 20`,
      )
    ).rows,
  };
}
