/**
 * User Repository
 *
 * Separation of Concerns: all user-domain DB queries (leaderboard, stats)
 * live here. Routes call these functions — no SQL in route handlers.
 */
import { pool, db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

// ── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardPeriod = "alltime" | "weekly" | "monthly";

export async function getLeaderboard(period: LeaderboardPeriod) {
    if (period === "alltime") {
        const [rows] = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.total_points as points, u.streak,
             u.correct_predictions as correct, u.total_predictions as total,
             u.\`rank\`,
             COALESCE(u.rank_last_week, 0) as rank_last_week
      FROM users u
      WHERE u.username != 'scorepion_system'
      ORDER BY u.total_points DESC
      LIMIT 100
    `) as any;
        return rows.map((row: any, idx: number) => ({
            ...row,
            rank: idx + 1,
            change: row.rank_last_week > 0 ? row.rank_last_week - (idx + 1) : 0,
        }));
    }

    if (period === "weekly") {
        const [rows] = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.streak,
             u.weekly_points as points,
             u.correct_predictions as correct,
             u.total_predictions as total
      FROM users u
      WHERE u.username != 'scorepion_system' AND u.weekly_points > 0
      ORDER BY u.weekly_points DESC
      LIMIT 100
    `) as any;
        return rows;
    }

    // monthly
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.streak,
             u.monthly_points as points,
             u.correct_predictions as correct,
             u.total_predictions as total
      FROM users u
      WHERE u.username != 'scorepion_system' AND u.monthly_points > 0
      ORDER BY u.monthly_points DESC
      LIMIT 100
    `) as any;
    return rows;
}

export function formatLeaderboardEntries(rows: any[]) {
    return rows.map((row: any, idx: number) => ({
        rank: idx + 1,
        username: row.username,
        avatar: row.avatar || (row.username || "??").substring(0, 2).toUpperCase(),
        points: parseInt(row.points) || 0,
        correct: parseInt(row.correct) || 0,
        total: parseInt(row.total) || 0,
        streak: parseInt(row.streak) || 0,
        change: row.change ?? 0,
        userId: row.id,
    }));
}

// ── User Stats ───────────────────────────────────────────────────────────────

export async function getUserWeeklyStats(userId: string) {
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const [rows] = await pool.query(`
    SELECT CAST(COALESCE(SUM(points), 0) AS SIGNED) as weekly_points,
           CAST(COUNT(id) AS SIGNED)                as weekly_predictions
    FROM predictions
    WHERE user_id = ? AND timestamp >= ?
  `, [userId, weekStart]) as any;
    return rows[0] as { weekly_points: string; weekly_predictions: string };
}

// ── Premium / Subscription ───────────────────────────────────────────────────

export async function getSubscriptionRow(subscriptionId: string) {
    const [rows] = await pool.query(
        `SELECT * FROM stripe_subscriptions WHERE id = ?`,
        [subscriptionId]
    ) as any;
    return rows[0] ?? null;
}

export async function updateUserPremiumStatus(userId: string, isPremium: boolean) {
    await db.update(users).set({ isPremium }).where(eq(users.id, userId));
}

export async function updateUserStripeCustomer(userId: string, customerId: string) {
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
}

export async function updateUserSubscription(
    customerId: string,
    subscriptionId: string,
    isPremium: boolean
) {
    await db.update(users)
        .set({ stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, isPremium })
        .where(eq(users.stripeCustomerId, customerId));
}
