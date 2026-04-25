/**
 * Push notification sender using Expo's push service.
 *
 * All notifications flow through here. Three types defined:
 *   - kickoffReminder: fires 30 minutes before a user's locked prediction
 *   - settlement: fires when points are awarded after match end
 *   - streakAtRisk: fires at a daily cutoff if user has predicted <1 match today and streak > 0
 *
 * Expo accepts batches of 100 notifications per request. Use `expo.chunkPushNotifications()`.
 */

import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { db } from "../db";
import { pushTokens } from "@shared/schema";
import { eq } from "drizzle-orm";

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

/**
 * Send a notification to all registered devices for a user.
 * Filters out invalid tokens and logs errors gracefully.
 */
export async function sendPushToUser(
  userId: string,
  message: Omit<ExpoPushMessage, "to">,
): Promise<void> {
  try {
    // Fetch all tokens for this user
    const tokens = await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));

    if (tokens.length === 0) {
      return; // No devices registered
    }

    // Filter valid Expo tokens
    const validTokens = tokens.map((t) => t.token).filter((t) => Expo.isExpoPushToken(t));

    if (validTokens.length === 0) {
      console.warn(
        `[Push] No valid Expo tokens for user ${userId}. Tokens: ${tokens.map((t) => t.token).join(", ")}`,
      );
      return;
    }

    // Build message batch
    const messages: ExpoPushMessage[] = validTokens.map((t) => ({
      ...message,
      to: t,
    }));

    // Chunk and send (Expo limit: 100 per request)
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const results = await expo.sendPushNotificationsAsync(chunk);
        // Log failures for invalid/expired tokens
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === "error") {
            console.warn(`[Push] Send failed for user ${userId}: ${result.message}`);
          }
        }
      } catch (err) {
        console.error(`[Push] Chunk send failed for user ${userId}:`, err);
      }
    }
  } catch (err) {
    console.error(`[Push] Error sending to user ${userId}:`, err);
  }
}

/**
 * Kickoff reminder: "Kickoff in 30min — your prediction locks soon"
 */
export async function sendKickoffReminder(
  userId: string,
  homeTeam: string,
  awayTeam: string,
  matchId: string,
): Promise<void> {
  await sendPushToUser(userId, {
    title: "Kickoff in 30min",
    body: `${homeTeam} vs ${awayTeam} — your prediction locks soon`,
    data: { matchId, type: "kickoff" },
    sound: "default",
  });
}

/**
 * Settlement push: awarded points + match summary
 */
export async function sendSettlementPush(
  userId: string,
  points: number,
  matchSummary: string,
  matchId: string,
): Promise<void> {
  const emoji = points >= 10 ? "🎯" : points >= 6 ? "✓" : points > 0 ? "·" : "😔";
  await sendPushToUser(userId, {
    title: `${emoji} ${points > 0 ? `+${points} points` : "No points"}`,
    body: matchSummary,
    data: { matchId, type: "settlement" },
    sound: points > 0 ? "default" : undefined,
  });
}

/**
 * Streak at risk: daily nudge if user has >0 streak and hasn't predicted today
 */
export async function sendStreakAtRiskPush(userId: string, currentStreak: number): Promise<void> {
  await sendPushToUser(userId, {
    title: "🔥 Streak at risk",
    body: `Your ${currentStreak}-day streak resets tonight if you don't lock a pick today.`,
    data: { type: "streak_at_risk" },
    sound: "default",
  });
}
