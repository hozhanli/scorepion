/**
 * Push notification token registration routes.
 * POST /api/push/register — register a device token
 * DELETE /api/push/unregister — unregister a device token
 */

import { Router } from "express";
import { db } from "../db";
import { pushTokens } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const pushRouter = Router();

/**
 * POST /api/push/token
 * Register or sync a device's push token. Upserts by user_id + token.
 */
pushRouter.post(
  "/token",
  requireAuth,
  asyncHandler(async (req, res) => {
    try {
      const { token, platform } = req.body;

      // Validate token format
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid push token: missing or invalid type" });
      }

      if (!token.startsWith("ExponentPushToken")) {
        return res
          .status(400)
          .json({ message: "Invalid push token: must start with ExponentPushToken" });
      }

      // Insert or ignore if duplicate
      await db
        .insert(pushTokens)
        .values({
          userId: req.userId!,
          token,
          platform: platform || "unknown",
        })
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });

      return res.json({ ok: true });
    } catch (err) {
      console.error("[Push] Register error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }),
);

/**
 * DELETE /api/push/token
 * Unregister a device token (e.g., on logout).
 */
pushRouter.delete(
  "/token",
  requireAuth,
  asyncHandler(async (req, res) => {
    try {
      const { token } = req.body;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid push token" });
      }

      await db
        .delete(pushTokens)
        .where(and(eq(pushTokens.userId, req.userId!), eq(pushTokens.token, token)));

      return res.json({ ok: true });
    } catch (err) {
      console.error("[Push] Unregister error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }),
);
