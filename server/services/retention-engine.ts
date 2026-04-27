import { pool } from "../db";
import {
  getTodayStringUtc,
  getYesterdayStringUtc,
  getWeekStartUtc,
  getRelativeTime,
} from "../utils/time";

const DERBY_PAIRS: [string, string][] = [
  ["Arsenal", "Tottenham"],
  ["Liverpool", "Everton"],
  ["Man United", "Man City"],
  ["Manchester United", "Manchester City"],
  ["Chelsea", "Tottenham"],
  ["Barcelona", "Real Madrid"],
  ["Atletico Madrid", "Real Madrid"],
  ["Inter", "AC Milan"],
  ["Inter Milan", "AC Milan"],
  ["Roma", "Lazio"],
  ["AS Roma", "SS Lazio"],
  ["Juventus", "Inter"],
  ["Juventus", "Inter Milan"],
  ["Bayern Munich", "Borussia Dortmund"],
  ["Bayern München", "Borussia Dortmund"],
  ["PSG", "Marseille"],
  ["Paris Saint-Germain", "Olympique de Marseille"],
  ["Galatasaray", "Fenerbahce"],
  ["Besiktas", "Galatasaray"],
  ["Fenerbahce", "Besiktas"],
  ["Trabzonspor", "Fenerbahce"],
  ["Newcastle", "Sunderland"],
  ["Newcastle United", "Sunderland"],
  ["Aston Villa", "Birmingham"],
  ["West Ham", "Millwall"],
  ["Sevilla", "Real Betis"],
  ["Valencia", "Villarreal"],
  ["Lyon", "Saint-Etienne"],
  ["Olympique Lyonnais", "AS Saint-Etienne"],
  ["Napoli", "Juventus"],
  ["Fiorentina", "Juventus"],
];

function isDerby(homeTeam: string, awayTeam: string): boolean {
  const h = homeTeam.toLowerCase();
  const a = awayTeam.toLowerCase();
  return DERBY_PAIRS.some(
    ([t1, t2]) =>
      (h.includes(t1.toLowerCase()) && a.includes(t2.toLowerCase())) ||
      (h.includes(t2.toLowerCase()) && a.includes(t1.toLowerCase())),
  );
}

export interface MatchImportance {
  matchId: string;
  score: number;
  tags: string[];
  factors: string[];
}

export async function calculateMatchImportance(matchId: string): Promise<MatchImportance> {
  const [resultRows] = (await pool.query(
    `
    SELECT f.api_fixture_id, f.home_team_id, f.away_team_id, f.league_id, f.kickoff, f.status,
           ht.name as home_name, at2.name as away_name,
           l.type as league_type
    FROM football_fixtures f
    JOIN football_teams ht ON f.home_team_id = ht.api_football_id
    JOIN football_teams at2 ON f.away_team_id = at2.api_football_id
    JOIN football_leagues l ON f.league_id = l.id
    WHERE CAST(f.api_fixture_id AS CHAR) COLLATE utf8mb4_unicode_ci = ?
    LIMIT 1
  `,
    [matchId],
  )) as any;

  if (resultRows.length === 0) {
    return { matchId, score: 50, tags: [], factors: [] };
  }

  const match = resultRows[0];
  let score = 50;
  const tags: string[] = [];
  const factors: string[] = [];

  const [homeStandingRows] = (await pool.query(
    `SELECT position, points FROM football_standings WHERE team_id = ? AND league_id = ? LIMIT 1`,
    [match.home_team_id, match.league_id],
  )) as any;
  const [awayStandingRows] = (await pool.query(
    `SELECT position, points FROM football_standings WHERE team_id = ? AND league_id = ? LIMIT 1`,
    [match.away_team_id, match.league_id],
  )) as any;

  const homePos = homeStandingRows[0]?.position || 99;
  const awayPos = awayStandingRows[0]?.position || 99;

  if (homePos <= 4 && awayPos <= 4) {
    score += 25;
    tags.push("Top 4 Clash");
    factors.push("top4_clash");
  } else if (homePos <= 6 && awayPos <= 6) {
    score += 15;
    tags.push("Big Match");
    factors.push("top6_clash");
  }

  if (homePos >= 15 && awayPos >= 15) {
    score += 15;
    tags.push("Relegation Battle");
    factors.push("relegation");
  }

  if (Math.abs(homePos - awayPos) <= 3 && homePos <= 10) {
    score += 10;
    factors.push("close_standings");
  }

  if (isDerby(match.home_name, match.away_name)) {
    score += 20;
    tags.push("Derby");
    factors.push("derby");
  }

  if (match.league_type === "Cup") {
    score += 10;
    tags.push("Cup Match");
    factors.push("cup");
  }

  const kickoff = new Date(match.kickoff).getTime();
  const hoursUntil = (kickoff - Date.now()) / 3600000;
  if (hoursUntil > 0 && hoursUntil < 6) {
    score += 10;
    factors.push("imminent");
  }

  score = Math.min(100, Math.max(0, score));
  return { matchId, score, tags, factors };
}

export async function calculateBatchImportance(
  matchIds: string[],
): Promise<Map<string, MatchImportance>> {
  const results = new Map<string, MatchImportance>();
  for (const id of matchIds) {
    try {
      results.set(id, await calculateMatchImportance(id));
    } catch {
      results.set(id, { matchId: id, score: 50, tags: [], factors: [] });
    }
  }
  return results;
}

export interface DailyPackResponse {
  id: string;
  date: string;
  matchIds: string[];
  completedMatchIds: string[];
  boostMatchId: string | null;
  totalPicks: number;
  completedPicks: number;
  isComplete: boolean;
  pointsEarned: number;
}

export async function getOrCreateDailyPack(
  userId: string,
  favoriteLeagues: string[],
): Promise<DailyPackResponse> {
  const today = getTodayStringUtc();

  const [existingRows] = (await pool.query(
    `SELECT * FROM daily_packs WHERE user_id = ? AND date = ?`,
    [userId, today],
  )) as any;

  if (existingRows.length > 0) {
    const pack = existingRows[0];
    return {
      id: pack.id,
      date: pack.date,
      matchIds: pack.match_ids || [],
      completedMatchIds: pack.completed_match_ids || [],
      boostMatchId: pack.boost_match_id,
      totalPicks: pack.total_picks,
      completedPicks: pack.completed_picks,
      isComplete: pack.is_complete,
      pointsEarned: pack.points_earned,
    };
  }

  // Use UTC times for consistent daily pack filtering across all timezones
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  ).toISOString();
  const tomorrowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  ).toISOString();

  let leagueFilter = "";
  const params: any[] = [todayStart, tomorrowStart];

  if (favoriteLeagues.length > 0) {
    const placeholders = favoriteLeagues.map(() => `?`).join(",");
    leagueFilter = `AND f.league_id IN (${placeholders})`;
    params.push(...favoriteLeagues);
  }

  const [fixturesRows] = (await pool.query(
    `
    SELECT CAST(f.api_fixture_id AS CHAR) COLLATE utf8mb4_unicode_ci as match_id, f.kickoff, f.league_id,
           ht.name as home_name, at2.name as away_name
    FROM football_fixtures f
    JOIN football_teams ht ON f.home_team_id = ht.api_football_id
    JOIN football_teams at2 ON f.away_team_id = at2.api_football_id
    WHERE f.kickoff >= ? AND f.kickoff < ?
    AND f.status IN ('upcoming', 'NS', 'TBD')
    ${leagueFilter}
    ORDER BY f.kickoff ASC
  `,
    params,
  )) as any;

  let matchIds = fixturesRows.map((r: any) => r.match_id);

  if (matchIds.length === 0) {
    const [allFixturesRows] = (await pool.query(
      `
      SELECT CAST(f.api_fixture_id AS CHAR) COLLATE utf8mb4_unicode_ci as match_id, f.kickoff
      FROM football_fixtures f
      WHERE f.kickoff >= ? AND f.kickoff < ?
      AND f.status IN ('upcoming', 'NS', 'TBD')
      ORDER BY f.kickoff ASC
    `,
      [todayStart, tomorrowStart],
    )) as any;
    matchIds = allFixturesRows.map((r: any) => r.match_id);
  }

  const importanceMap = await calculateBatchImportance(matchIds);
  matchIds.sort((a: string, b: string) => {
    const ia = importanceMap.get(a)?.score || 50;
    const ib = importanceMap.get(b)?.score || 50;
    return ib - ia;
  });

  const selectedIds = matchIds.slice(0, Math.min(7, Math.max(3, matchIds.length)));
  const totalPicks = selectedIds.length;

  await pool.query(
    `
    INSERT INTO daily_packs (user_id, date, match_ids, completed_match_ids, total_picks, completed_picks)
    VALUES (?, ?, ?, '[]', ?, 0)
    ON DUPLICATE KEY UPDATE match_ids = VALUES(match_ids)
  `,
    [userId, today, JSON.stringify(selectedIds), totalPicks],
  );

  const [packRows] = (await pool.query(`SELECT * FROM daily_packs WHERE user_id = ? AND date = ?`, [
    userId,
    today,
  ])) as any;

  const pack = packRows[0];
  return {
    id: pack.id,
    date: pack.date,
    matchIds: pack.match_ids || selectedIds,
    completedMatchIds: [],
    boostMatchId: null,
    totalPicks,
    completedPicks: 0,
    isComplete: false,
    pointsEarned: 0,
  };
}

export async function markDailyPickComplete(
  userId: string,
  matchId: string,
): Promise<DailyPackResponse | null> {
  const today = getTodayStringUtc();

  // Use a transaction so completedIds update + streak update are atomic
  const client = await pool.getConnection();
  try {
    await client.query("BEGIN");

    // Lock the row to prevent concurrent updates (SELECT ... FOR UPDATE)
    const [packRows] = (await client.query(
      `SELECT * FROM daily_packs WHERE user_id = ? AND date = ? FOR UPDATE`,
      [userId, today],
    )) as any;
    if (packRows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const row = packRows[0];
    const completedIds: string[] = row.completed_match_ids || [];

    // Idempotency: already completed this match
    if (completedIds.includes(matchId)) {
      await client.query("ROLLBACK");
      return {
        id: row.id,
        date: row.date,
        matchIds: row.match_ids || [],
        completedMatchIds: completedIds,
        boostMatchId: row.boost_match_id,
        totalPicks: row.total_picks,
        completedPicks: completedIds.length,
        isComplete: row.is_complete,
        pointsEarned: row.points_earned,
      };
    }

    completedIds.push(matchId);
    const isComplete = completedIds.length >= row.total_picks;

    await client.query(
      `
      UPDATE daily_packs SET completed_match_ids = ?, completed_picks = ?, is_complete = ?
      WHERE id = ?
    `,
      [JSON.stringify(completedIds), completedIds.length, isComplete, row.id],
    );

    if (isComplete) {
      // Check if yesterday's pack was completed to decide streak continuation
      const yesterday = getYesterdayStringUtc();
      const [yesterdayPackRows] = (await client.query(
        `SELECT is_complete FROM daily_packs WHERE user_id = ? AND date = ?`,
        [userId, yesterday],
      )) as any;
      const yesterdayComplete = yesterdayPackRows.length > 0 && yesterdayPackRows[0].is_complete;

      if (yesterdayComplete) {
        // Continue streak
        await client.query(
          `
          UPDATE users SET streak = streak + 1, best_streak = GREATEST(best_streak, streak + 1) WHERE id = ?
        `,
          [userId],
        );
      } else {
        // Reset streak to 1 (today is a fresh start)
        await client.query(
          `
          UPDATE users SET streak = 1, best_streak = GREATEST(best_streak, 1) WHERE id = ?
        `,
          [userId],
        );
      }
      await logEvent(userId, "daily_pack_complete", { date: today });
    }

    await client.query("COMMIT");

    return {
      id: row.id,
      date: row.date,
      matchIds: row.match_ids || [],
      completedMatchIds: completedIds,
      boostMatchId: row.boost_match_id,
      totalPicks: row.total_picks,
      completedPicks: completedIds.length,
      isComplete,
      pointsEarned: row.points_earned,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function setBoostPick(
  userId: string,
  matchId: string,
): Promise<{ success: boolean; message: string }> {
  const today = getTodayStringUtc();

  // Use a transaction so daily_packs + boost_picks stay in sync
  const client = await pool.getConnection();
  try {
    await client.query("BEGIN");

    const [packRows] = (await client.query(
      `SELECT * FROM daily_packs WHERE user_id = ? AND date = ? FOR UPDATE`,
      [userId, today],
    )) as any;
    if (packRows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "No daily pack found" };
    }

    const row = packRows[0];
    const packMatchIds: string[] = row.match_ids || [];
    if (!packMatchIds.includes(matchId)) {
      await client.query("ROLLBACK");
      return { success: false, message: "Match not in daily pack" };
    }

    const newBoostId = row.boost_match_id === matchId ? null : matchId;

    await client.query(`UPDATE daily_packs SET boost_match_id = ? WHERE id = ?`, [
      newBoostId,
      row.id,
    ]);

    if (newBoostId) {
      await client.query(
        `
        INSERT INTO boost_picks (user_id, match_id, date, multiplier)
        VALUES (?, ?, ?, 2)
        ON DUPLICATE KEY UPDATE match_id = VALUES(match_id)
      `,
        [userId, matchId, today],
      );
      await logEvent(userId, "boost_pick", { matchId, date: today });
    } else {
      await client.query(`DELETE FROM boost_picks WHERE user_id = ? AND date = ?`, [userId, today]);
    }

    await client.query("COMMIT");
    return { success: true, message: newBoostId ? "Boost set" : "Boost removed" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function settleBoosts(): Promise<number> {
  const [unsettledRows] = (await pool.query(`
    SELECT bp.*, p.points as pred_points, p.settled as pred_settled
    FROM boost_picks bp
    LEFT JOIN predictions p ON p.match_id = bp.match_id AND p.user_id = bp.user_id
    WHERE bp.settled = false AND p.settled = true
  `)) as any;

  let count = 0;
  for (const row of unsettledRows) {
    const originalPoints = row.pred_points || 0;
    const boostedPoints = originalPoints * row.multiplier;
    const bonusPoints = boostedPoints - originalPoints;

    await pool.query(
      `
      UPDATE boost_picks SET original_points = ?, boosted_points = ?, settled = true WHERE id = ?
    `,
      [originalPoints, boostedPoints, row.id],
    );

    if (bonusPoints > 0) {
      await pool.query(`UPDATE users SET total_points = total_points + ? WHERE id = ?`, [
        bonusPoints,
        row.user_id,
      ]);
    }

    count++;
  }

  return count;
}

export interface ChaseData {
  userRank: number;
  userPoints: number;
  chaseTarget: {
    username: string;
    avatar: string;
    rank: number;
    points: number;
    gap: number;
  } | null;
  swingMatches: {
    matchId: string;
    potentialSwing: number;
    homeTeam: string;
    awayTeam: string;
  }[];
  weeklyCountdown: string;
}

export async function getChaseData(userId: string, period: string = "alltime"): Promise<ChaseData> {
  const [userResultRows] = (await pool.query(
    `SELECT username, total_points, streak, avatar FROM users WHERE id = ?`,
    [userId],
  )) as any;
  if (userResultRows.length === 0) {
    return { userRank: 0, userPoints: 0, chaseTarget: null, swingMatches: [], weeklyCountdown: "" };
  }

  const user = userResultRows[0];
  const userPoints = user.total_points;

  const [leaderboardRows] = (await pool.query(`
    SELECT id, username, avatar, total_points as points
    FROM users WHERE username != 'scorepion_system'
    ORDER BY total_points DESC
    LIMIT 100
  `)) as any;

  const entries = leaderboardRows;
  const userIdx = entries.findIndex((e: any) => e.id === userId);
  const userRank = userIdx >= 0 ? userIdx + 1 : entries.length + 1;

  let chaseTarget = null;
  if (userIdx > 0) {
    const target = entries[userIdx - 1];
    chaseTarget = {
      username: target.username,
      avatar: target.avatar || target.username.substring(0, 2).toUpperCase(),
      rank: userIdx,
      points: target.points,
      gap: target.points - userPoints,
    };
  }

  // Use UTC times for consistent filtering across all timezones
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  ).toISOString();
  const tomorrowEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2, 23, 59, 59, 999),
  ).toISOString();

  const [upcomingRows] = (await pool.query(
    `
    SELECT CAST(f.api_fixture_id AS CHAR) COLLATE utf8mb4_unicode_ci as match_id,
           ht.name as home_name, at2.name as away_name
    FROM football_fixtures f
    JOIN football_teams ht ON f.home_team_id = ht.api_football_id
    JOIN football_teams at2 ON f.away_team_id = at2.api_football_id
    WHERE f.kickoff >= ? AND f.kickoff < ?
    AND f.status IN ('upcoming', 'NS', 'TBD')
    ORDER BY f.kickoff ASC
    LIMIT 5
  `,
    [todayStart, tomorrowEnd],
  )) as any;

  const swingMatches = upcomingRows.map((r: any) => ({
    matchId: r.match_id,
    potentialSwing: 10,
    homeTeam: r.home_name,
    awayTeam: r.away_name,
  }));

  // Compute countdown to next Sunday 23:59:59 UTC (weekly reset)
  const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilSunday = (7 - utcDay) % 7;
  const resetTime = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilSunday,
      23,
      59,
      59,
      0,
    ),
  );
  if (resetTime.getTime() <= now.getTime()) {
    resetTime.setUTCDate(resetTime.getUTCDate() + 7);
  }
  const msUntilReset = resetTime.getTime() - now.getTime();
  const daysUntilReset = Math.ceil(msUntilReset / 86_400_000);
  const weeklyCountdown = `${daysUntilReset}d`;

  return { userRank, userPoints, chaseTarget, swingMatches, weeklyCountdown };
}

export interface AchievementData {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tier: string;
  earnedAt: number;
}

export async function getUserAchievements(userId: string): Promise<AchievementData[]> {
  const [resultRows] = (await pool.query(
    `SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC`,
    [userId],
  )) as any;
  return resultRows.map((r: any) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    icon: r.icon,
    color: r.color,
    tier: r.tier,
    earnedAt: Number(r.earned_at),
  }));
}

export async function checkAndAwardAchievements(userId: string): Promise<AchievementData[]> {
  const [userRows] = (await pool.query(`SELECT * FROM users WHERE id = ?`, [userId])) as any;
  if (userRows.length === 0) return [];

  const u = userRows[0];
  const [existingRows] = (await pool.query(
    `SELECT type, tier FROM achievements WHERE user_id = ?`,
    [userId],
  )) as any;
  const existingSet = new Set(existingRows.map((r: any) => `${r.type}:${r.tier}`));

  const newAchievements: AchievementData[] = [];

  const streakAchievements = [
    {
      threshold: 3,
      tier: "bronze",
      title: "Hot Streak",
      desc: "3-day prediction streak",
      icon: "flame",
      color: "#CD7F32",
    },
    {
      threshold: 7,
      tier: "silver",
      title: "On Fire",
      desc: "7-day prediction streak",
      icon: "flame",
      color: "#C0C0C0",
    },
    {
      threshold: 14,
      tier: "gold",
      title: "Unstoppable",
      desc: "14-day prediction streak",
      icon: "flame",
      color: "#FFD700",
    },
    {
      threshold: 30,
      tier: "diamond",
      title: "Legend",
      desc: "30-day prediction streak",
      icon: "flame",
      color: "#B9F2FF",
    },
  ];

  for (const sa of streakAchievements) {
    if (u.streak >= sa.threshold && !existingSet.has(`streak:${sa.tier}`)) {
      const ach = await awardAchievement(
        userId,
        "streak",
        sa.title,
        sa.desc,
        sa.icon,
        sa.color,
        sa.tier,
      );
      if (ach) newAchievements.push(ach);
    }
  }

  const predAchievements = [
    { threshold: 10, tier: "bronze", title: "Getting Started", desc: "10 predictions made" },
    { threshold: 50, tier: "silver", title: "Committed", desc: "50 predictions made" },
    { threshold: 100, tier: "gold", title: "Veteran", desc: "100 predictions made" },
    { threshold: 500, tier: "diamond", title: "Oracle", desc: "500 predictions made" },
  ];

  for (const pa of predAchievements) {
    if (u.total_predictions >= pa.threshold && !existingSet.has(`predictions:${pa.tier}`)) {
      const ach = await awardAchievement(
        userId,
        "predictions",
        pa.title,
        pa.desc,
        "football",
        "#3B82F6",
        pa.tier,
      );
      if (ach) newAchievements.push(ach);
    }
  }

  const pointAchievements = [
    { threshold: 50, tier: "bronze", title: "Rising Star", desc: "Earn 50 points" },
    { threshold: 200, tier: "silver", title: "Contender", desc: "Earn 200 points" },
    { threshold: 500, tier: "gold", title: "Champion", desc: "Earn 500 points" },
    { threshold: 1000, tier: "diamond", title: "Grand Master", desc: "Earn 1000 points" },
  ];

  for (const pa of pointAchievements) {
    if (u.total_points >= pa.threshold && !existingSet.has(`points:${pa.tier}`)) {
      const ach = await awardAchievement(
        userId,
        "points",
        pa.title,
        pa.desc,
        "trophy",
        "#FFD700",
        pa.tier,
      );
      if (ach) newAchievements.push(ach);
    }
  }

  const [exactResultRows] = (await pool.query(
    `SELECT COUNT(*) as cnt FROM predictions WHERE user_id = ? AND settled = true AND points >= 10`,
    [userId],
  )) as any;
  const exactCount = Number(exactResultRows[0]?.cnt || 0);

  const exactAchievements = [
    { threshold: 1, tier: "bronze", title: "Bullseye", desc: "First exact score prediction" },
    { threshold: 5, tier: "silver", title: "Sharp Shooter", desc: "5 exact score predictions" },
    { threshold: 20, tier: "gold", title: "Psychic", desc: "20 exact score predictions" },
  ];

  for (const ea of exactAchievements) {
    if (exactCount >= ea.threshold && !existingSet.has(`exact_score:${ea.tier}`)) {
      const ach = await awardAchievement(
        userId,
        "exact_score",
        ea.title,
        ea.desc,
        "star",
        "#FF6B6B",
        ea.tier,
      );
      if (ach) newAchievements.push(ach);
    }
  }

  return newAchievements;
}

async function awardAchievement(
  userId: string,
  type: string,
  title: string,
  description: string,
  icon: string,
  color: string,
  tier: string,
): Promise<AchievementData | null> {
  try {
    await pool.query(
      `
      INSERT INTO achievements (user_id, type, title, description, icon, color, tier)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [userId, type, title, description, icon, color, tier],
    );

    const [achRows] = (await pool.query(
      `SELECT * FROM achievements WHERE user_id = ? AND type = ? AND tier = ? ORDER BY earned_at DESC LIMIT 1`,
      [userId, type, tier],
    )) as any;

    const r = achRows[0];
    await logEvent(userId, "achievement_earned", { type, tier, title });

    return {
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      icon: r.icon,
      color: r.color,
      tier: r.tier,
      earnedAt: Number(r.earned_at),
    };
  } catch {
    return null;
  }
}

export async function getWeeklyWinners(): Promise<any[]> {
  const [resultRows] = (await pool.query(`
    SELECT ww.*, u.username, u.avatar FROM weekly_winners ww
    JOIN users u ON ww.user_id = u.id
    ORDER BY ww.created_at DESC
    LIMIT 10
  `)) as any;
  return resultRows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    username: r.username,
    avatar: r.avatar || r.username.substring(0, 2).toUpperCase(),
    weekStart: r.week_start,
    points: r.points,
    rank: r.rank,
    type: r.type,
  }));
}

export async function computeWeeklyWinners(): Promise<number> {
  const weekStart = getWeekStartUtc();

  const [existingRows2] = (await pool.query(
    `SELECT id FROM weekly_winners WHERE week_start = ? AND type = 'global'`,
    [weekStart],
  )) as any;
  if (existingRows2.length > 0) return 0;

  const prevWeekStart = new Date();
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const day = prevWeekStart.getDay();
  const diff = prevWeekStart.getDate() - day + (day === 0 ? -6 : 1);
  prevWeekStart.setDate(diff);
  const prevWeek = `${prevWeekStart.getFullYear()}-${String(prevWeekStart.getMonth() + 1).padStart(2, "0")}-${String(prevWeekStart.getDate()).padStart(2, "0")}`;
  const prevWeekEnd = new Date(prevWeekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() + 7);

  const [topUsersRows] = (await pool.query(
    `
    SELECT u.id, CAST(SUM(p.points) AS SIGNED) as weekly_points
    FROM users u
    JOIN predictions p ON p.user_id = u.id
    WHERE p.timestamp >= ? AND p.timestamp < ?
    AND u.username != 'scorepion_system'
    GROUP BY u.id
    ORDER BY weekly_points DESC
    LIMIT 3
  `,
    [prevWeekStart.getTime(), prevWeekEnd.getTime()],
  )) as any;

  let inserted = 0;
  for (let i = 0; i < topUsersRows.length; i++) {
    const row = topUsersRows[i];
    try {
      await pool.query(
        `
        INSERT INTO weekly_winners (user_id, week_start, points, \`rank\`, type)
        VALUES (?, ?, ?, ?, 'global')
      `,
        [row.id, prevWeek, row.weekly_points, i + 1],
      );
      inserted++;

      if (i === 0) {
        await awardAchievement(
          row.id,
          "weekly_winner",
          "Weekly Champion",
          "Won the weekly leaderboard",
          "trophy",
          "#FFD700",
          "gold",
        );
      }
    } catch {
      /* already exists */
    }
  }

  return inserted;
}

export async function getGroupActivityEnhanced(groupId: string): Promise<any[]> {
  const [membershipRows] = (await pool.query(
    `SELECT user_id FROM group_members WHERE group_id = ?`,
    [groupId],
  )) as any;
  if (membershipRows.length === 0) return [];

  const userIds = membershipRows.map((r: any) => r.user_id);
  const userPlaceholders = userIds.map(() => "?").join(",");

  const [usersRows] = (await pool.query(
    `SELECT id, username, avatar, streak, total_points FROM users WHERE id IN (${userPlaceholders})`,
    userIds,
  )) as any;
  const userMap = new Map<
    string,
    { username: string; avatar: string; color: string; streak: number; totalPoints: number }
  >(
    usersRows.map((u: any, idx: number) => [
      u.id,
      {
        username: u.username,
        avatar: u.avatar || u.username.substring(0, 2).toUpperCase(),
        color: ["#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"][
          idx % 7
        ],
        streak: u.streak,
        totalPoints: u.total_points,
      },
    ]),
  );

  const items: any[] = [];

  const [boostsRows] = (await pool.query(
    `
    SELECT bp.*, ht.name as home_name, at2.name as away_name
    FROM boost_picks bp
    LEFT JOIN football_fixtures f ON bp.match_id = CAST(f.api_fixture_id AS CHAR) COLLATE utf8mb4_unicode_ci
    LEFT JOIN football_teams ht ON f.home_team_id = ht.api_football_id
    LEFT JOIN football_teams at2 ON f.away_team_id = at2.api_football_id
    WHERE bp.user_id IN (${userPlaceholders})
    ORDER BY bp.created_at DESC
    LIMIT 10
  `,
    userIds,
  )) as any;

  for (const b of boostsRows) {
    const user = userMap.get(b.user_id);
    if (!user) continue;
    items.push({
      id: `boost-${b.id}`,
      type: "boost",
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      message: `used 2x boost on ${b.home_name || "???"} vs ${b.away_name || "???"}`,
      icon: "flash",
      iconColor: "#FFD700",
      timestamp: new Date(Number(b.created_at)).toISOString(),
      relativeTime: getRelativeTime(Number(b.created_at)),
    });
  }

  const [achievementsRows] = (await pool.query(
    `
    SELECT * FROM achievements WHERE user_id IN (${userPlaceholders}) ORDER BY earned_at DESC LIMIT 10
  `,
    userIds,
  )) as any;

  for (const a of achievementsRows) {
    const user = userMap.get(a.user_id);
    if (!user) continue;
    items.push({
      id: `ach-${a.id}`,
      type: "achievement",
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      message: `earned "${a.title}" badge`,
      detail: a.description,
      icon: a.icon || "trophy",
      iconColor: a.color || "#FFD700",
      timestamp: new Date(Number(a.earned_at)).toISOString(),
      relativeTime: getRelativeTime(Number(a.earned_at)),
    });
  }

  for (const [, user] of userMap) {
    if (user.streak >= 3) {
      items.push({
        id: `streak-${user.username}-${user.streak}`,
        type: "streak",
        username: user.username,
        avatar: user.avatar,
        color: user.color,
        message: `is on a ${user.streak}-day streak`,
        icon: "flame",
        iconColor: "#F97316",
        timestamp: new Date().toISOString(),
        relativeTime: "now",
      });
    }
  }

  const [winnersRows] = (await pool.query(
    `
    SELECT ww.*, u.username, u.avatar FROM weekly_winners ww
    JOIN users u ON ww.user_id = u.id
    WHERE ww.user_id IN (${userPlaceholders}) AND ww.\`rank\` = 1
    ORDER BY ww.created_at DESC
    LIMIT 3
  `,
    userIds,
  )) as any;

  for (const w of winnersRows) {
    const user = userMap.get(w.user_id);
    if (!user) continue;
    items.push({
      id: `winner-${w.id}`,
      type: "weekly_winner",
      username: user.username,
      avatar: user.avatar,
      color: user.color,
      message: `won the weekly leaderboard with ${w.points} pts`,
      icon: "trophy",
      iconColor: "#FFD700",
      timestamp: new Date(Number(w.created_at)).toISOString(),
      relativeTime: getRelativeTime(Number(w.created_at)),
    });
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, 30);
}

export async function logEvent(
  userId: string | null,
  eventType: string,
  eventData: any = {},
): Promise<void> {
  try {
    await pool.query(`INSERT INTO event_log (user_id, event_type, event_data) VALUES (?, ?, ?)`, [
      userId,
      eventType,
      JSON.stringify(eventData),
    ]);
  } catch (err) {
    console.error("[EventLog] Error:", err);
  }
}

export async function getEventStats(): Promise<any> {
  const now = Date.now();
  const dayAgo = now - 86400000;
  const weekAgo = now - 604800000;

  const [dailyPacksResult, dailyBoostsResult, dailyStreakBreaksResult, weeklyPacksResult] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*) as cnt FROM event_log WHERE event_type = 'daily_pack_complete' AND timestamp >= ?`,
        [dayAgo],
      ),
      pool.query(
        `SELECT COUNT(*) as cnt FROM event_log WHERE event_type = 'boost_pick' AND timestamp >= ?`,
        [dayAgo],
      ),
      pool.query(
        `SELECT COUNT(*) as cnt FROM event_log WHERE event_type = 'streak_break' AND timestamp >= ?`,
        [dayAgo],
      ),
      pool.query(
        `SELECT COUNT(*) as cnt FROM event_log WHERE event_type = 'daily_pack_complete' AND timestamp >= ?`,
        [weekAgo],
      ),
    ]);

  const [dailyPacks] = dailyPacksResult as any;
  const [dailyBoosts] = dailyBoostsResult as any;
  const [dailyStreakBreaks] = dailyStreakBreaksResult as any;
  const [weeklyPacks] = weeklyPacksResult as any;

  return {
    daily: {
      packCompletions: Number(dailyPacks[0]?.cnt || 0),
      boostUsage: Number(dailyBoosts[0]?.cnt || 0),
      streakBreaks: Number(dailyStreakBreaks[0]?.cnt || 0),
    },
    weekly: {
      packCompletions: Number(weeklyPacks[0]?.cnt || 0),
    },
  };
}

export async function getUserPerformanceInsights(userId: string): Promise<any> {
  const [leaguePerfRows] = (await pool.query(
    `
    SELECT l.name as league_name, l.id as league_id,
           CAST(COUNT(p.id) AS SIGNED) as total,
           CAST(COUNT(CASE WHEN p.points >= 5 THEN 1 END) AS SIGNED) as correct,
           CAST(COALESCE(SUM(p.points), 0) AS SIGNED) as points
    FROM predictions p
    JOIN football_fixtures f ON p.match_id = CAST(f.api_fixture_id AS CHAR) COLLATE utf8mb4_unicode_ci
    JOIN football_leagues l ON f.league_id = l.id
    WHERE p.user_id = ? AND p.settled = true
    GROUP BY l.name, l.id
    ORDER BY points DESC
  `,
    [userId],
  )) as any;

  const bestLeague = leaguePerfRows[0] || null;
  const worstLeague = leaguePerfRows[leaguePerfRows.length - 1] || null;

  const [derbyPerfRows] = (await pool.query(
    `
    SELECT CAST(COUNT(p.id) AS SIGNED) as total,
           CAST(COUNT(CASE WHEN p.points >= 5 THEN 1 END) AS SIGNED) as correct,
           CAST(COALESCE(AVG(p.points), 0) AS DECIMAL(5,1)) as avg_points
    FROM predictions p
    WHERE p.user_id = ? AND p.settled = true
  `,
    [userId],
  )) as any;

  const [recentFormRows] = (await pool.query(
    `
    SELECT p.points FROM predictions p
    WHERE p.user_id = ? AND p.settled = true
    ORDER BY p.timestamp DESC
    LIMIT 10
  `,
    [userId],
  )) as any;

  const formPoints = recentFormRows.map((r: any) => r.points || 0);
  const avgRecent =
    formPoints.length > 0
      ? (formPoints.reduce((a: number, b: number) => a + b, 0) / formPoints.length).toFixed(1)
      : "0";

  return {
    leaguePerformance: leaguePerfRows.map((r: any) => ({
      leagueName: r.league_name,
      leagueId: r.league_id,
      total: r.total,
      correct: r.correct,
      accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
      points: r.points,
    })),
    bestLeague: bestLeague
      ? {
          name: bestLeague.league_name,
          accuracy:
            bestLeague.total > 0 ? Math.round((bestLeague.correct / bestLeague.total) * 100) : 0,
        }
      : null,
    worstLeague:
      worstLeague && worstLeague !== bestLeague
        ? {
            name: worstLeague.league_name,
            accuracy:
              worstLeague.total > 0
                ? Math.round((worstLeague.correct / worstLeague.total) * 100)
                : 0,
          }
        : null,
    overallAvgPoints: derbyPerfRows[0]?.avg_points || 0,
    recentFormAvg: avgRecent,
    recentForm: formPoints,
  };
}

// getRelativeTime is now imported from ../utils/time
