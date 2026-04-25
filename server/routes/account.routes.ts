import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import {
  users,
  predictions,
  groupMembers,
  pushTokens,
  dailyPacks,
  boostPicks,
  achievements,
  weeklyWinners,
  eventLog,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export const accountRouter = Router();

/**
 * DELETE /api/account
 * Permanently delete the authenticated user's account and all associated data.
 * Cascade deletes: predictions → group_members → users
 */
accountRouter.delete("/", requireAuth, async (req, res) => {
  const userId = req.userId!;

  try {
    // Cascade delete with Drizzle ORM — child tables before parent
    await db.delete(predictions).where(eq(predictions.userId, userId));
    await db.delete(groupMembers).where(eq(groupMembers.userId, userId));
    await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
    await db.delete(dailyPacks).where(eq(dailyPacks.userId, userId));
    await db.delete(boostPicks).where(eq(boostPicks.userId, userId));
    await db.delete(achievements).where(eq(achievements.userId, userId));
    await db.delete(weeklyWinners).where(eq(weeklyWinners.userId, userId));
    await db.delete(eventLog).where(eq(eventLog.userId, userId));

    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));

    return res.json({ ok: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Account] Delete failed:", { userId, err: errMsg });
    return res.status(500).json({ message: "Failed to delete account" });
  }
});
