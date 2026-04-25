import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { db } from "../db";
import { users, predictions, groupMembers } from "@shared/schema";
import { eq } from "drizzle-orm";

export const accountRouter = Router();

/**
 * DELETE /api/account
 * Permanently delete the authenticated user's account and all associated data.
 * Cascade deletes: predictions → group_members → users
 */
accountRouter.delete(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId!;

    try {
      // Cascade delete with Drizzle ORM
      // Predictions reference users, so delete them first
      await db.delete(predictions).where(eq(predictions.userId, userId));

      // Group membership references users, so delete those
      await db.delete(groupMembers).where(eq(groupMembers.userId, userId));

      // Finally, delete the user
      await db.delete(users).where(eq(users.id, userId));

      return res.json({ ok: true });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Account] Delete failed:", { userId, err: errMsg });
      return res.status(500).json({ message: "Failed to delete account" });
    }
  }),
);
