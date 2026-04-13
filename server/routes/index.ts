import { Router } from "express";
import { authRouter } from "./auth.routes";
import { profileRouter } from "./profile.routes";
import { userRouter, leaderboardRouter } from "./user.routes";
import { predictionsRouter } from "./predictions.routes";
import { groupsRouter } from "./groups.routes";
import { stripeRouter } from "./stripe.routes";
import { retentionRouter } from "./retention.routes";
import { footballRouter } from "./football.routes";
import { syncRouter } from "./sync.routes";
import { healthRouter } from "./health.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/leaderboard", leaderboardRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/predictions", predictionsRouter);
apiRouter.use("/groups", groupsRouter);
apiRouter.use("/stripe", stripeRouter);
apiRouter.use("/retention", retentionRouter);
apiRouter.use("/football/sync", syncRouter); // strict split from football logic
apiRouter.use("/football", footballRouter);
