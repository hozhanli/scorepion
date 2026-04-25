/**
 * Football Repository
 *
 * Separation of Concerns: this is the ONLY layer that executes SQL
 * for football-domain data. Routes and services call functions here
 * instead of embedding queries inline.
 */
import { eq, desc } from "drizzle-orm";
import { pool, db } from "../db";
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
  syncLog,
} from "@shared/schema";
import { sql } from "drizzle-orm";

// ── Filters ────────────────────────────────────────────────────────────────

export interface FixtureFilters {
  league?: string;
  status?: string;
  date?: string;
}

// ── Formatted shapes ────────────────────────────────────────────────────────

function formatTeam(r: any, prefix: string) {
  return {
    id: String(r[`${prefix}api_id`] ?? r[`${prefix}api_football_id`]),
    name: r[`${prefix}name`],
    shortName: r[`${prefix}short`] ?? r[`${prefix}short_name`] ?? r[`${prefix}name`],
    color: r[`${prefix}color`],
    logo: r[`${prefix}logo`] ?? "",
  };
}

// ── Queries ─────────────────────────────────────────────────────────────────

export async function getAllLeagues() {
  return db.select().from(footballLeagues);
}

export async function getFixtures(filters: FixtureFilters = {}) {
  const conditions: string[] = ["1=1"];
  const params: any[] = [];

  if (filters.league) {
    params.push(filters.league);
    conditions.push(`f.league_id = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`f.status = $${params.length}`);
  }
  if (filters.date) {
    params.push(filters.date);
    conditions.push(`f.kickoff::date = $${params.length}::date`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const result = await pool.query(
    `
    SELECT
      f.api_fixture_id, f.league_id, f.home_score, f.away_score,
      f.status, f.status_short, f.kickoff, f.minute, f.venue, f.referee, f.round, f.season,
      ht.api_football_id as home_api_id, ht.name as home_name, ht.short_name as home_short,
      ht.logo as home_logo, ht.color as home_color,
      at2.api_football_id as away_api_id, at2.name as away_name, at2.short_name as away_short,
      at2.logo as away_logo, at2.color as away_color,
      l.id as l_id, l.name as l_name, l.country as l_country, l.flag as l_flag,
      l.color as l_color, l.icon as l_icon, l.logo as l_logo
    FROM football_fixtures f
    JOIN football_teams ht  ON f.home_team_id = ht.api_football_id
    JOIN football_teams at2 ON f.away_team_id = at2.api_football_id
    JOIN football_leagues l ON f.league_id = l.id
    ${whereClause}
    ORDER BY f.kickoff ASC
  `,
    params,
  );

  return result.rows.map((r: any) => ({
    id: String(r.api_fixture_id),
    league: {
      id: r.l_id,
      name: r.l_name,
      country: r.l_country,
      flag: r.l_flag ?? "",
      color: r.l_color,
      icon: r.l_icon,
      logo: r.l_logo ?? "",
    },
    homeTeam: {
      id: String(r.home_api_id),
      name: r.home_name,
      shortName: r.home_short,
      color: r.home_color,
      logo: r.home_logo ?? "",
    },
    awayTeam: {
      id: String(r.away_api_id),
      name: r.away_name,
      shortName: r.away_short,
      color: r.away_color,
      logo: r.away_logo ?? "",
    },
    homeScore: r.home_score,
    awayScore: r.away_score,
    status: r.status,
    statusShort: r.status_short,
    kickoff: r.kickoff,
    minute: r.minute,
    venue: r.venue,
    referee: r.referee,
    round: r.round,
    season: r.season,
  }));
}

export async function getFixtureKickoff(matchId: string) {
  const result = await pool.query(
    `SELECT kickoff, status, status_short FROM football_fixtures WHERE CAST(api_fixture_id AS TEXT) = $1 LIMIT 1`,
    [matchId],
  );
  return result.rows[0] ?? null;
}

export async function getStandings(leagueId: string) {
  const rows = await db
    .select({ standing: footballStandings, team: footballTeams })
    .from(footballStandings)
    .innerJoin(footballTeams, eq(footballStandings.teamId, footballTeams.apiFootballId))
    .where(eq(footballStandings.leagueId, leagueId))
    .orderBy(footballStandings.position);

  return rows.map((r) => ({
    position: r.standing.position,
    team: {
      id: String(r.team.apiFootballId),
      name: r.team.name,
      shortName: r.team.shortName,
      color: r.team.color,
      logo: r.team.logo ?? "",
    },
    played: r.standing.played,
    won: r.standing.won,
    drawn: r.standing.drawn,
    lost: r.standing.lost,
    goalsFor: r.standing.goalsFor,
    goalsAgainst: r.standing.goalsAgainst,
    goalDifference: r.standing.goalDifference,
    points: r.standing.points,
    form: (r.standing.form ?? "")
      .split("")
      .filter((c) => ["W", "D", "L"].includes(c))
      .slice(-5),
    group: r.standing.group,
  }));
}

export async function getTopScorers(leagueId: string) {
  const rows = await db
    .select({ scorer: footballTopScorers, team: footballTeams })
    .from(footballTopScorers)
    .innerJoin(footballTeams, eq(footballTopScorers.teamId, footballTeams.apiFootballId))
    .where(eq(footballTopScorers.leagueId, leagueId))
    .orderBy(desc(footballTopScorers.goals));

  return rows.map((r, idx) => ({
    rank: idx + 1,
    playerName: r.scorer.playerName,
    playerPhoto: r.scorer.playerPhoto ?? "",
    team: {
      id: String(r.team.apiFootballId),
      name: r.team.name,
      shortName: r.team.shortName,
      color: r.team.color,
      logo: r.team.logo ?? "",
    },
    goals: r.scorer.goals,
    assists: r.scorer.assists,
    matches: r.scorer.matches,
  }));
}

export async function getTopAssists(leagueId: string) {
  const rows = await db
    .select({ player: footballTopAssists, team: footballTeams })
    .from(footballTopAssists)
    .innerJoin(footballTeams, eq(footballTopAssists.teamId, footballTeams.apiFootballId))
    .where(eq(footballTopAssists.leagueId, leagueId))
    .orderBy(desc(footballTopAssists.assists));

  return rows.map((r, idx) => ({
    rank: idx + 1,
    playerName: r.player.playerName,
    playerPhoto: r.player.playerPhoto ?? "",
    team: {
      id: String(r.team.apiFootballId),
      name: r.team.name,
      shortName: r.team.shortName,
      color: r.team.color,
      logo: r.team.logo ?? "",
    },
    assists: r.player.assists,
    goals: r.player.goals,
    matches: r.player.matches,
  }));
}

export async function getTopYellowCards(leagueId: string) {
  const rows = await db
    .select({ player: footballTopYellowCards, team: footballTeams })
    .from(footballTopYellowCards)
    .innerJoin(footballTeams, eq(footballTopYellowCards.teamId, footballTeams.apiFootballId))
    .where(eq(footballTopYellowCards.leagueId, leagueId))
    .orderBy(desc(footballTopYellowCards.yellowCards));

  return rows.map((r, idx) => ({
    rank: idx + 1,
    playerName: r.player.playerName,
    playerPhoto: r.player.playerPhoto ?? "",
    team: {
      id: String(r.team.apiFootballId),
      name: r.team.name,
      shortName: r.team.shortName,
      color: r.team.color,
      logo: r.team.logo ?? "",
    },
    yellowCards: r.player.yellowCards,
    matches: r.player.matches,
  }));
}

export async function getTopRedCards(leagueId: string) {
  const rows = await db
    .select({ player: footballTopRedCards, team: footballTeams })
    .from(footballTopRedCards)
    .innerJoin(footballTeams, eq(footballTopRedCards.teamId, footballTeams.apiFootballId))
    .where(eq(footballTopRedCards.leagueId, leagueId))
    .orderBy(desc(footballTopRedCards.redCards));

  return rows.map((r, idx) => ({
    rank: idx + 1,
    playerName: r.player.playerName,
    playerPhoto: r.player.playerPhoto ?? "",
    team: {
      id: String(r.team.apiFootballId),
      name: r.team.name,
      shortName: r.team.shortName,
      color: r.team.color,
      logo: r.team.logo ?? "",
    },
    redCards: r.player.redCards,
    matches: r.player.matches,
  }));
}

export async function getInjuries(leagueId: string) {
  const rows = await db
    .select({ injury: footballInjuries, team: footballTeams })
    .from(footballInjuries)
    .innerJoin(footballTeams, eq(footballInjuries.teamId, footballTeams.apiFootballId))
    .where(eq(footballInjuries.leagueId, leagueId));

  return rows.map((r) => ({
    playerName: r.injury.playerName,
    playerPhoto: r.injury.playerPhoto ?? "",
    team: {
      id: String(r.team.apiFootballId),
      name: r.team.name,
      shortName: r.team.shortName,
      color: r.team.color,
      logo: r.team.logo ?? "",
    },
    type: r.injury.type,
    reason: r.injury.reason,
    fixtureDate: r.injury.fixtureDate ?? "",
  }));
}

export async function getTransfers(leagueId: string) {
  const rows = await db
    .select()
    .from(footballTransfers)
    .where(eq(footballTransfers.leagueId, leagueId));

  return rows.map((r) => ({
    playerName: r.playerName,
    playerPhoto: r.playerPhoto ?? "",
    teamIn: { id: r.teamInId, name: r.teamInName, logo: r.teamInLogo },
    teamOut: { id: r.teamOutId, name: r.teamOutName, logo: r.teamOutLogo },
    date: r.transferDate,
    type: r.transferType,
  }));
}

export async function getCommunityPicks(matchId: string) {
  const [picks, total] = await Promise.all([
    pool.query(
      `SELECT home_score, away_score, COUNT(*) as count
       FROM predictions WHERE match_id = $1
       GROUP BY home_score, away_score ORDER BY count DESC LIMIT 8`,
      [matchId],
    ),
    pool.query(`SELECT COUNT(*) as total FROM predictions WHERE match_id = $1`, [matchId]),
  ]);

  const totalPredictions = Number(total.rows[0]?.total ?? 0);
  if (totalPredictions === 0) {
    return { totalPredictions: 0, communityPicks: [], mostPickedScore: null, mostPickedPercent: 0 };
  }

  const communityPicks = picks.rows.map((r: any) => ({
    score: `${r.home_score}-${r.away_score}`,
    percent: Math.round((Number(r.count) / totalPredictions) * 100),
  }));

  return {
    totalPredictions,
    communityPicks,
    mostPickedScore: communityPicks[0]?.score ?? null,
    mostPickedPercent: communityPicks[0]?.percent ?? 0,
  };
}

// ── Fixture events ────────────────────────────────────────────────────────────

export async function getFixtureEvents(fixtureApiId: number) {
  const result = await pool.query(
    `
    SELECT e.fixture_id, e.team_id, e.player_id, e.player_name,
           e.assist_id, e.assist_name, e.type, e.detail, e.comments,
           e.elapsed, e.extra_time,
           t.name as team_name, t.logo as team_logo, t.color as team_color
    FROM football_fixture_events e
    LEFT JOIN football_teams t ON t.api_football_id = e.team_id
    WHERE e.fixture_id = $1
    ORDER BY e.elapsed ASC, e.extra_time ASC NULLS LAST
  `,
    [fixtureApiId],
  );

  return result.rows.map((r: any) => ({
    elapsed: r.elapsed,
    extraTime: r.extra_time,
    team: {
      id: r.team_id,
      name: r.team_name ?? "",
      logo: r.team_logo ?? "",
      color: r.team_color ?? "#333",
    },
    player: { id: r.player_id, name: r.player_name ?? "" },
    assist: r.assist_id ? { id: r.assist_id, name: r.assist_name ?? "" } : null,
    type: r.type,
    detail: r.detail ?? "",
    comments: r.comments ?? "",
  }));
}

// ── Fixture lineups ───────────────────────────────────────────────────────────

export async function getFixtureLineups(fixtureApiId: number) {
  const result = await pool.query(
    `
    SELECT l.fixture_id, l.team_id, l.formation, l.player_id, l.player_name,
           l.player_number, l.player_pos, l.grid, l.is_starting,
           t.name as team_name, t.logo as team_logo, t.color as team_color
    FROM football_fixture_lineups l
    LEFT JOIN football_teams t ON t.api_football_id = l.team_id
    WHERE l.fixture_id = $1
    ORDER BY l.team_id, l.is_starting DESC, l.player_number ASC
  `,
    [fixtureApiId],
  );

  // Group by team
  const teams: Record<number, any> = {};
  for (const r of result.rows) {
    if (!teams[r.team_id]) {
      teams[r.team_id] = {
        team: { id: r.team_id, name: r.team_name, logo: r.team_logo, color: r.team_color },
        formation: r.formation,
        startXI: [],
        subs: [],
      };
    }
    const player = {
      id: r.player_id,
      name: r.player_name,
      number: r.player_number,
      pos: r.player_pos,
      grid: r.grid,
    };
    if (r.is_starting) teams[r.team_id].startXI.push(player);
    else teams[r.team_id].subs.push(player);
  }
  return Object.values(teams);
}

// ── Fixture match statistics ──────────────────────────────────────────────────

export async function getFixtureMatchStats(fixtureApiId: number) {
  const result = await pool.query(
    `
    SELECT fs.*, t.name as team_name, t.logo as team_logo, t.color as team_color
    FROM football_fixture_stats fs
    LEFT JOIN football_teams t ON t.api_football_id = fs.team_id
    WHERE fs.fixture_id = $1
  `,
    [fixtureApiId],
  );

  return result.rows.map((r: any) => ({
    team: { id: r.team_id, name: r.team_name, logo: r.team_logo, color: r.team_color },
    statistics: {
      shotsOnGoal: r.shots_on_goal,
      shotsTotal: r.shots_total,
      blockedShots: r.blocked_shots,
      shotsInsideBox: r.shots_inside_box,
      fouls: r.fouls,
      cornerKicks: r.corner_kicks,
      offsides: r.offsides,
      possession: r.ball_possession,
      yellowCards: r.yellow_cards,
      redCards: r.red_cards,
      saves: r.goalkeeper_saves,
      totalPasses: r.total_passes,
      accuratePasses: r.accurate_passes,
    },
  }));
}

// ── H2H ──────────────────────────────────────────────────────────────────────

export async function getH2H(team1ApiId: number, team2ApiId: number) {
  const t1 = Math.min(team1ApiId, team2ApiId);
  const t2 = Math.max(team1ApiId, team2ApiId);

  const result = await pool.query(
    `
    SELECT h.*,
           ht.name as home_name, ht.short_name as home_short, ht.logo as home_logo, ht.color as home_color,
           at2.name as away_name, at2.short_name as away_short, at2.logo as away_logo, at2.color as away_color
    FROM football_h2h h
    LEFT JOIN football_teams ht  ON ht.api_football_id = h.home_team_id
    LEFT JOIN football_teams at2 ON at2.api_football_id = h.away_team_id
    WHERE h.team1_id=$1 AND h.team2_id=$2
      AND h.status='finished'
    ORDER BY h.kickoff DESC
    LIMIT 15
  `,
    [t1, t2],
  );

  return result.rows.map((r: any) => ({
    date: r.kickoff,
    homeTeam: {
      id: String(r.home_team_id),
      name: r.home_name,
      shortName: r.home_short,
      color: r.home_color,
      logo: r.home_logo ?? "",
    },
    awayTeam: {
      id: String(r.away_team_id),
      name: r.away_name,
      shortName: r.away_short,
      color: r.away_color,
      logo: r.away_logo ?? "",
    },
    homeScore: r.home_score,
    awayScore: r.away_score,
    competition: r.league_name || r.league_id || "",
    venue: r.venue || null,
  }));
}

// ── Team statistics ───────────────────────────────────────────────────────────

export async function getTeamStats(teamApiId: number) {
  const result = await pool.query(
    `
    SELECT ts.*, t.name as team_name, t.logo as team_logo
    FROM football_team_stats ts
    LEFT JOIN football_teams t ON t.api_football_id = ts.team_id
    WHERE ts.team_id = $1
    ORDER BY ts.updated_at DESC
    LIMIT 3
  `,
    [teamApiId],
  );

  if (result.rows.length === 0) return null;

  return result.rows.map((r: any) => ({
    leagueId: r.league_id,
    season: r.season,
    team: { id: r.team_id, name: r.team_name, logo: r.team_logo },
    matchesPlayed: r.matches_played,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    goalsFor: r.goals_for,
    goalsAgainst: r.goals_against,
    avgGoalsFor: r.avg_goals_for,
    avgGoalsAgainst: r.avg_goals_against,
    cleanSheets: r.clean_sheets,
    failedToScore: r.failed_to_score,
    longestWinStreak: r.longest_win_streak,
    longestLoseStreak: r.longest_lose_streak,
    form: r.form,
  }));
}

// ── Sync status ───────────────────────────────────────────────────────────────

export async function getSyncStatus(
  getRequestCount: () => number,
  getRemainingRequests: () => number,
) {
  const result = await pool.query(`
    SELECT sync_type, league_id, status, request_count, synced_at, error
    FROM sync_log
    ORDER BY synced_at DESC
    LIMIT 30
  `);
  return {
    dailyRequests: getRequestCount(),
    remaining: getRemainingRequests(),
    recentSyncs: result.rows,
  };
}
