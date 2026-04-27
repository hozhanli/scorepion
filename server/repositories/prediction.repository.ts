import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { predictions } from "@shared/schema";
import type { Prediction } from "@shared/schema";

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
    return db.select().from(predictions).where(eq(predictions.userId, userId));
}

export async function getUserPrediction(userId: string, matchId: string): Promise<Prediction | undefined> {
    const [pred] = await db.select().from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, matchId)));
    return pred;
}

/**
 * Insert or update a prediction in a single query using ON DUPLICATE KEY UPDATE.
 * Requires a unique constraint on (userId, matchId).
 */
export async function upsertPrediction(
    userId: string,
    matchId: string,
    homeScore: number,
    awayScore: number,
): Promise<Prediction> {
    await db
        .insert(predictions)
        .values({
            userId,
            matchId,
            homeScore,
            awayScore,
            timestamp: Date.now(),
        })
        .onDuplicateKeyUpdate({
            set: {
                homeScore,
                awayScore,
                timestamp: Date.now(),
            },
        });
    const [pred] = await db.select().from(predictions)
        .where(and(eq(predictions.userId, userId), eq(predictions.matchId, matchId)));
    return pred;
}
