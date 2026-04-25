import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as userService from "../services/user.service";
import { LeaderboardPeriod } from "../repositories/user.repository";
import { asyncHandler } from "../middleware/asyncHandler";

export const userRouter = Router();
export const leaderboardRouter = Router();

leaderboardRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const period = ((req.query.period as string) || "alltime") as LeaderboardPeriod;
      const leaderboard = await userService.getLeaderboard(period);
      return res.json(leaderboard);
    } catch (err: any) {
      if (err.name === "UserError")
        return res.status(err.status || 400).json({ message: err.message });
      console.error("Error fetching leaderboard:", err);
      return res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  }),
);

userRouter.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await userService.getUserStats(req.userId!);
      return res.json(stats);
    } catch (err: any) {
      if (err.name === "UserError")
        return res.status(err.status || 404).json({ message: err.message });
      console.error("Error fetching user stats:", err);
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  }),
);
