import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import * as predictionService from "../services/prediction.service";
import * as syncService from "../services/sync.service";
import { asyncHandler } from "../middleware/asyncHandler";

export const predictionsRouter = Router();

predictionsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const preds = await predictionService.getUserPredictions(req.session.userId!);
    return res.json(preds);
  }),
);

predictionsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { matchId, homeScore, awayScore } = req.body;
    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ message: "Missing fields" });
    }

    try {
      const pred = await predictionService.submitPrediction(
        req.session.userId!,
        matchId,
        homeScore,
        awayScore,
      );
      return res.json(pred);
    } catch (err: any) {
      if (err.name === "PredictionError") {
        return res.status(err.status || 400).json({ message: err.message });
      }
      throw err; // re-throw for asyncHandler → global error handler
    }
  }),
);

// Admin webhook to trigger prediction settlements
predictionsRouter.post(
  "/settle",
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const settled = await syncService.settlePredictions();
    return res.json({ message: "Settlement complete", settled });
  }),
);
