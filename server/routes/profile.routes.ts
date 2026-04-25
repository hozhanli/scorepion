import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as userService from "../services/user.service";
import { asyncHandler } from "../middleware/asyncHandler";

export const profileRouter = Router();

profileRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await userService.getUserProfile(req.userId!);
      return res.json(user);
    } catch (err: any) {
      if (err.name === "UserError")
        return res.status(err.status || 404).json({ message: err.message });
      console.error("Profile GET error:", err);
      return res.status(500).json({ message: "Failed to fetch profile" });
    }
  }),
);

// Only these fields may be set via the profile update endpoint.
const ALLOWED_PROFILE_FIELDS = new Set(["avatar", "username", "displayName", "favoriteLeagues"]);

profileRouter.put(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Whitelist: strip any fields not explicitly allowed
      const sanitized: Record<string, unknown> = {};
      for (const key of Object.keys(req.body)) {
        if (ALLOWED_PROFILE_FIELDS.has(key)) {
          sanitized[key] = req.body[key];
        }
      }
      const updated = await userService.updateUserProfile(req.userId!, sanitized);
      return res.json(updated);
    } catch (err: any) {
      if (err.name === "UserError")
        return res.status(err.status || 404).json({ message: err.message });
      console.error("Profile PUT error:", err);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  }),
);
