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
 * Insert or update a prediction in a single query using ON CONFLICT.
 * Requires a unique constraint on (userId, matchId).
 */
export async function upsertPrediction(
    userId: string,
    matchId: string,
    homeScore: number,
    awayScore: number,
): Promise<Prediction> {
    const [pred] = await db
        .insert(predictions)
        .values({
            userId,
            matchId,
            homeScore,
            awayScore,
            timestamp: Date.now(),
        })
        .onConflictDoUpdate({
            target: [predictions.userId, predictions.matchId],
            set: {
                homeScore,
                awayScore,
                timestamp: Date.now(),
            },
        })
        .returning();
    return pred;
}
