import { Router } from "express";
import { authRouter } from "./auth.routes";
import { profileRouter } from "./profile.routes";
import { userRouter, leaderboardRouter } from "./user.routes";
import { predictionsRouter } from "./predictions.routes";
import { groupsRouter } from "./groups.routes";
import { stripeRouter } from "./stripe.routes";
import billingRouter from "./billing.routes";
import { retentionRouter } from "./retention.routes";
import { footballRouter } from "./football.routes";
import { syncRouter } from "./sync.routes";
import { healthRouter } from "./health.routes";
import { accountRouter } from "./account.routes";
import { pushRouter } from "./push.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/account", accountRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/leaderboard", leaderboardRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/predictions", predictionsRouter);
apiRouter.use("/groups", groupsRouter);
apiRouter.use("/stripe", stripeRouter);
apiRouter.use("/billing", billingRouter); // Stripe checkout/webhook (gated by ENABLE_BILLING)
apiRouter.use("/retention", retentionRouter);
apiRouter.use("/push", pushRouter);
apiRouter.use("/football/sync", syncRouter); // strict split from football logic
apiRouter.use("/football", footballRouter);
