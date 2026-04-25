import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import * as authRepo from "../repositories/user-auth.repository";
import * as retention from "../services/retention-engine";
import { asyncHandler } from "../middleware/asyncHandler";

export const retentionRouter = Router();

retentionRouter.get(
  "/daily-pack",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authRepo.getUserById(req.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    const favLeagues = ((req.query.leagues as string) || "").split(",").filter(Boolean);
    const pack = await retention.getOrCreateDailyPack(req.userId!, favLeagues);
    return res.json(pack);
  }),
);

retentionRouter.post(
  "/daily-pack/complete",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ message: "matchId required" });
    const pack = await retention.markDailyPickComplete(req.userId!, matchId);
    if (!pack) return res.status(404).json({ message: "No daily pack found" });
    const newAchievements = await retention.checkAndAwardAchievements(req.userId!);
    return res.json({ pack, newAchievements });
  }),
);

retentionRouter.post(
  "/boost",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { matchId } = req.body;
    if (!matchId) return res.status(400).json({ message: "matchId required" });
    const result = await retention.setBoostPick(req.userId!, matchId);
    return res.json(result);
  }),
);

retentionRouter.get(
  "/chase",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as string) || "alltime";
    const data = await retention.getChaseData(req.userId!, period);
    return res.json(data);
  }),
);

retentionRouter.get(
  "/achievements",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const achievements = await retention.getUserAchievements(req.userId!);
    const newAchievements = await retention.checkAndAwardAchievements(req.userId!);
    return res.json({ achievements, newAchievements });
  }),
);

retentionRouter.get(
  "/weekly-winners",
  asyncHandler(async (_req: Request, res: Response) => {
    const winners = await retention.getWeeklyWinners();
    return res.json(winners);
  }),
);

retentionRouter.post(
  "/weekly-winners/compute",
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const count = await retention.computeWeeklyWinners();
    return res.json({ computed: count });
  }),
);

retentionRouter.get(
  "/match-importance/:matchId",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await retention.calculateMatchImportance(req.params.matchId as string);
    return res.json(data);
  }),
);

retentionRouter.get(
  "/group-activity/:groupId",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const data = await retention.getGroupActivityEnhanced(req.params.groupId as string);
    return res.json(data);
  }),
);

retentionRouter.get(
  "/insights",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const data = await retention.getUserPerformanceInsights(req.userId!);
    return res.json(data);
  }),
);

retentionRouter.get(
  "/event-stats",
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await retention.getEventStats();
    return res.json(stats);
  }),
);

retentionRouter.post(
  "/settle-boosts",
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const count = await retention.settleBoosts();
    return res.json({ settled: count });
  }),
);
