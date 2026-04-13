/**
 * Achievements Engine
 * Awards achievements triggered by prediction settlement, streak milestones, and ranking events.
 */

interface AchievementDef {
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  streak: number;
  bestStreak: number;
  exactScores: number;       // count of exact score predictions
  weeklyPoints: number;
  consecutiveDays: number;   // days with at least 1 correct prediction
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // First blood
  {
    type: "first_prediction",
    title: "First Blood",
    description: "Made your first correct prediction",
    icon: "football",
    color: "#3B82F6",
    tier: "bronze",
    check: (s) => s.correctPredictions >= 1,
  },
  // Exact scores
  {
    type: "sniper_bronze",
    title: "Sniper",
    description: "Predicted 5 exact scores",
    icon: "locate",
    color: "#CD7F32",
    tier: "bronze",
    check: (s) => s.exactScores >= 5,
  },
  {
    type: "sniper_silver",
    title: "Sniper Elite",
    description: "Predicted 20 exact scores",
    icon: "locate",
    color: "#C0C0C0",
    tier: "silver",
    check: (s) => s.exactScores >= 20,
  },
  {
    type: "sniper_gold",
    title: "Legendary Sniper",
    description: "Predicted 50 exact scores",
    icon: "locate",
    color: "#FFD700",
    tier: "gold",
    check: (s) => s.exactScores >= 50,
  },
  // Streaks
  {
    type: "streak_3",
    title: "On Fire",
    description: "3-day prediction streak",
    icon: "flame",
    color: "#FF8C00",
    tier: "bronze",
    check: (s) => s.streak >= 3,
  },
  {
    type: "streak_7",
    title: "Week Warrior",
    description: "7-day prediction streak",
    icon: "flame",
    color: "#FF8C00",
    tier: "silver",
    check: (s) => s.streak >= 7,
  },
  {
    type: "streak_30",
    title: "Iron Predictor",
    description: "30-day prediction streak",
    icon: "flame",
    color: "#FFD700",
    tier: "gold",
    check: (s) => s.streak >= 30,
  },
  // Points milestones
  {
    type: "points_100",
    title: "Century",
    description: "Earned 100 points",
    icon: "star",
    color: "#CD7F32",
    tier: "bronze",
    check: (s) => s.totalPoints >= 100,
  },
  {
    type: "points_500",
    title: "High Scorer",
    description: "Earned 500 points",
    icon: "star",
    color: "#C0C0C0",
    tier: "silver",
    check: (s) => s.totalPoints >= 500,
  },
  {
    type: "points_2000",
    title: "Pro Predictor",
    description: "Earned 2,000 points",
    icon: "trophy",
    color: "#FFD700",
    tier: "gold",
    check: (s) => s.totalPoints >= 2000,
  },
  {
    type: "points_5000",
    title: "Legend",
    description: "Earned 5,000 points",
    icon: "diamond",
    color: "#E040FB",
    tier: "diamond",
    check: (s) => s.totalPoints >= 5000,
  },
  // Accuracy
  {
    type: "accuracy_60",
    title: "Sharp Eye",
    description: "60% accuracy over 20+ predictions",
    icon: "eye",
    color: "#14B8A6",
    tier: "silver",
    check: (s) => s.totalPredictions >= 20 && (s.correctPredictions / s.totalPredictions) >= 0.6,
  },
  {
    type: "accuracy_75",
    title: "Oracle",
    description: "75% accuracy over 30+ predictions",
    icon: "eye",
    color: "#FFD700",
    tier: "gold",
    check: (s) => s.totalPredictions >= 30 && (s.correctPredictions / s.totalPredictions) >= 0.75,
  },
];

export async function checkAndAwardAchievements(
  pool: any,
  userId: string,
  stats: UserStats
): Promise<{ type: string; title: string }[]> {
  // Fetch exact score count for this user
  const exactResult = await pool.query(
    `SELECT COUNT(*) as cnt FROM predictions p
     JOIN football_fixtures f ON CAST(f.api_fixture_id AS TEXT) = p.match_id
     WHERE p.user_id = $1 AND p.settled = true
       AND p.home_score = f.home_score AND p.away_score = f.away_score`,
    [userId]
  );
  const exactScores = parseInt(exactResult.rows[0]?.cnt || "0", 10);
  const enrichedStats = { ...stats, exactScores };

  // Get already-earned achievements
  const existing = await pool.query(
    `SELECT type FROM achievements WHERE user_id = $1`,
    [userId]
  );
  const earned = new Set(existing.rows.map((r: any) => r.type));

  const newAchievements: { type: string; title: string }[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (earned.has(def.type)) continue;
    if (!def.check(enrichedStats)) continue;

    // Award it
    await pool.query(
      `INSERT INTO achievements (user_id, type, title, description, icon, color, tier, season)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [userId, def.type, def.title, def.description, def.icon, def.color, def.tier, "2024-25"]
    );
    newAchievements.push({ type: def.type, title: def.title });
  }

  return newAchievements;
}

export async function getUserStats(pool: any, userId: string): Promise<UserStats> {
  const [userRow] = (await pool.query(
    `SELECT total_points, correct_predictions, total_predictions, streak, best_streak, weekly_points
     FROM users WHERE id = $1`,
    [userId]
  )).rows;

  return {
    totalPoints: userRow?.total_points ?? 0,
    correctPredictions: userRow?.correct_predictions ?? 0,
    totalPredictions: userRow?.total_predictions ?? 0,
    streak: userRow?.streak ?? 0,
    bestStreak: userRow?.best_streak ?? 0,
    exactScores: 0, // filled by checkAndAwardAchievements
    weeklyPoints: userRow?.weekly_points ?? 0,
    consecutiveDays: 0,
  };
}
