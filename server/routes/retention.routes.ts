import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import * as authRepo from "../repositories/user-auth.repository";
import * as retention from "../services/retention-engine";
import { asyncHandler } from "../middleware/asyncHandler";

export const retentionRouter = Router();

retentionRouter.get("/daily-pack", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const user = await authRepo.getUserById(req.session.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });
        const favLeagues = (req.query.leagues as string || '').split(',').filter(Boolean);
        const pack = await retention.getOrCreateDailyPack(req.session.userId!, favLeagues);
        return res.json(pack);
    } catch (err) {
        console.error("Daily pack error:", err);
        return res.status(500).json({ message: "Failed to get daily pack" });
    }
}));

retentionRouter.post("/daily-pack/complete", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { matchId } = req.body;
        if (!matchId) return res.status(400).json({ message: "matchId required" });
        const pack = await retention.markDailyPickComplete(req.session.userId!, matchId);
        if (!pack) return res.status(404).json({ message: "No daily pack found" });
        const newAchievements = await retention.checkAndAwardAchievements(req.session.userId!);
        return res.json({ pack, newAchievements });
    } catch (err) {
        console.error("Daily pack complete error:", err);
        return res.status(500).json({ message: "Failed to complete daily pick" });
    }
}));

retentionRouter.post("/boost", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { matchId } = req.body;
        if (!matchId) return res.status(400).json({ message: "matchId required" });
        const result = await retention.setBoostPick(req.session.userId!, matchId);
        return res.json(result);
    } catch (err) {
        console.error("Boost error:", err);
        return res.status(500).json({ message: "Failed to set boost" });
    }
}));

retentionRouter.get("/chase", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || 'alltime';
        const data = await retention.getChaseData(req.session.userId!, period);
        return res.json(data);
    } catch (err) {
        console.error("Chase data error:", err);
        return res.status(500).json({ message: "Failed to get chase data" });
    }
}));

retentionRouter.get("/achievements", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const achievements = await retention.getUserAchievements(req.session.userId!);
        const newAchievements = await retention.checkAndAwardAchievements(req.session.userId!);
        return res.json({ achievements, newAchievements });
    } catch (err) {
        console.error("Achievements error:", err);
        return res.status(500).json({ message: "Failed to get achievements" });
    }
}));

retentionRouter.get("/weekly-winners", asyncHandler(async (_req: Request, res: Response) => {
    try {
        const winners = await retention.getWeeklyWinners();
        return res.json(winners);
    } catch (err) {
        console.error("Weekly winners error:", err);
        return res.status(500).json({ message: "Failed to get weekly winners" });
    }
}));

retentionRouter.post("/weekly-winners/compute", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
    try {
        const count = await retention.computeWeeklyWinners();
        return res.json({ computed: count });
    } catch (err) {
        console.error("Compute weekly winners error:", err);
        return res.status(500).json({ message: "Failed to compute weekly winners" });
    }
}));

retentionRouter.get("/match-importance/:matchId", asyncHandler(async (req: Request, res: Response) => {
    try {
        const data = await retention.calculateMatchImportance(req.params.matchId as string);
        return res.json(data);
    } catch (err) {
        console.error("Match importance error:", err);
        return res.status(500).json({ message: "Failed to get match importance" });
    }
}));

retentionRouter.get("/group-activity/:groupId", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const data = await retention.getGroupActivityEnhanced(req.params.groupId as string);
        return res.json(data);
    } catch (err) {
        console.error("Enhanced group activity error:", err);
        return res.status(500).json({ message: "Failed to get enhanced group activity" });
    }
}));

retentionRouter.get("/insights", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const data = await retention.getUserPerformanceInsights(req.session.userId!);
        return res.json(data);
    } catch (err) {
        console.error("Insights error:", err);
        return res.status(500).json({ message: "Failed to get insights" });
    }
}));

retentionRouter.get("/event-stats", asyncHandler(async (_req: Request, res: Response) => {
    try {
        const stats = await retention.getEventStats();
        return res.json(stats);
    } catch (err) {
        console.error("Event stats error:", err);
        return res.status(500).json({ message: "Failed to get event stats" });
    }
}));

retentionRouter.post("/settle-boosts", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
    try {
        const count = await retention.settleBoosts();
        return res.json({ settled: count });
    } catch (err) {
        console.error("Settle boosts error:", err);
        return res.status(500).json({ message: "Failed to settle boosts" });
    }
}));
