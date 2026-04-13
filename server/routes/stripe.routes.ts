import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as authRepo from "../repositories/user-auth.repository";
import * as stripeService from "../services/stripe.service";
import { asyncHandler } from "../middleware/asyncHandler";

export const stripeRouter = Router();

stripeRouter.get("/config", asyncHandler(async (_req: Request, res: Response) => {
    try {
        const config = await stripeService.getStripeConfig();
        return res.json(config);
    } catch (err) {
        console.error("Stripe config error:", err);
        return res.status(500).json({ message: "Failed to get Stripe config" });
    }
}));

stripeRouter.get("/products", asyncHandler(async (_req: Request, res: Response) => {
    try {
        const products = await stripeService.getStripeProducts();
        return res.json(products);
    } catch (err) {
        console.error("Stripe products error:", err);
        return res.status(500).json({ message: "Failed to fetch products" });
    }
}));

stripeRouter.post("/checkout", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { priceId } = req.body;
        if (!priceId) return res.status(400).json({ message: "Price ID required" });

        const user = await authRepo.getUserById(req.session.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });

        const session = await stripeService.createCheckoutSession(user, priceId);
        return res.json(session);
    } catch (err) {
        console.error("Checkout error:", err);
        return res.status(500).json({ message: "Failed to create checkout session" });
    }
}));

stripeRouter.get("/success", asyncHandler(async (req: Request, res: Response) => {
    try {
        const sessionId = req.query.session_id as string;
        if (!sessionId) return res.redirect('/');

        await stripeService.handleCheckoutSuccess(sessionId);

        return res.send(`
      <html>
        <head><meta charset="utf-8"><title>Success</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:system-ui;background:#0B1120;color:#fff;text-align:center;">
          <div>
            <h1 style="font-size:48px;margin-bottom:8px;">&#127881;</h1>
            <h2>Welcome to Premium!</h2>
            <p style="color:#999;">You can close this tab and return to the app.</p>
          </div>
        </body>
      </html>
    `);
    } catch (err) {
        console.error("Success callback error:", err);
        return res.redirect('/');
    }
}));

stripeRouter.get("/cancel", (_req: Request, res: Response) => {
    res.send(`
    <html>
      <head><meta charset="utf-8"><title>Cancelled</title></head>
      <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:system-ui;background:#0B1120;color:#fff;text-align:center;">
        <div>
          <h2>Payment Cancelled</h2>
          <p style="color:#999;">You can close this tab and return to the app.</p>
        </div>
      </body>
    </html>
  `);
});

stripeRouter.get("/subscription", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const user = await authRepo.getUserById(req.session.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });

        const status = await stripeService.getSubscriptionStatus(user);
        return res.json(status);
    } catch (err) {
        console.error("Subscription status error:", err);
        return res.status(500).json({ message: "Failed to get subscription status" });
    }
}));

stripeRouter.post("/portal", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    try {
        const user = await authRepo.getUserById(req.session.userId!);
        if (!user) return res.status(404).json({ message: "User not found" });

        const session = await stripeService.createBillingPortalSession(user);
        return res.json(session);
    } catch (err: any) {
        console.error("Portal error:", err);
        return res.status(500).json({ message: err.message || "Failed to create portal session" });
    }
}));
