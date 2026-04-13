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
        const result = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.total_points as points, u.streak,
             u.correct_predictions as correct, u.total_predictions as total,
             u.rank,
             COALESCE(u.rank_last_week, 0) as rank_last_week
      FROM users u
      WHERE u.username != 'scorepion_system'
      ORDER BY u.total_points DESC
      LIMIT 100
    `);
        return result.rows.map((row: any, idx: number) => ({
            ...row,
            rank: idx + 1,
            change: row.rank_last_week > 0 ? row.rank_last_week - (idx + 1) : 0,
        }));
    }

    if (period === "weekly") {
        const result = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.streak,
             u.weekly_points as points,
             u.correct_predictions as correct,
             u.total_predictions as total
      FROM users u
      WHERE u.username != 'scorepion_system' AND u.weekly_points > 0
      ORDER BY u.weekly_points DESC
      LIMIT 100
    `);
        return result.rows;
    }

    // monthly
    const result = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.streak,
             u.monthly_points as points,
             u.correct_predictions as correct,
             u.total_predictions as total
      FROM users u
      WHERE u.username != 'scorepion_system' AND u.monthly_points > 0
      ORDER BY u.monthly_points DESC
      LIMIT 100
    `);
    return result.rows;
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
    const result = await pool.query(`
    SELECT COALESCE(SUM(points), 0)::int as weekly_points,
           COUNT(id)::int                as weekly_predictions
    FROM predictions
    WHERE user_id = $1 AND timestamp >= $2
  `, [userId, weekStart]);
    return result.rows[0] as { weekly_points: string; weekly_predictions: string };
}

// ── Premium / Subscription ───────────────────────────────────────────────────

export async function getSubscriptionRow(subscriptionId: string) {
    const result = await pool.query(
        `SELECT * FROM stripe.subscriptions WHERE id = $1`,
        [subscriptionId]
    );
    return result.rows[0] ?? null;
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
