import { Router, Request, Response, raw } from "express";
import { isBillingEnabled, createCheckoutSession, handleWebhook } from "../services/stripe.service";

const router = Router();

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session.
 * Body: { priceKey: 'premium_monthly' | 'premium_yearly' }
 * Returns: { sessionId: string }
 */
router.post("/checkout", async (req: Request, res: Response) => {
  if (!isBillingEnabled()) {
    return res.status(404).end();
  }

  try {
    const { priceKey } = req.body;
    if (!priceKey) {
      return res.status(400).json({ error: "priceKey is required" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const returnUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || "5000"}`;
    const sessionId = await createCheckoutSession(userId, priceKey, returnUrl);

    res.json({ sessionId });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

/**
 * POST /api/billing/webhook
 * Receives Stripe webhook events.
 * Must receive raw body for signature verification.
 */
router.post("/webhook", raw({ type: "application/json" }), async (req: Request, res: Response) => {
  if (!isBillingEnabled()) {
    return res.status(404).end();
  }

  try {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    await handleWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).json({ error: `Webhook Error: ${(err as Error).message}` });
  }
});

/**
 * GET /api/billing/subscription
 * Get the current user's subscription status.
 * Returns: { subscription: {...} | null, isPremium: boolean }
 */
router.get("/subscription", async (req: Request, res: Response) => {
  if (!isBillingEnabled()) {
    return res.status(404).end();
  }

  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // TODO: query DB subscriptions table
    // For now, return empty (no active subscriptions until billing is activated)
    res.json({ subscription: null, isPremium: false });
  } catch (err) {
    console.error("Subscription lookup error:", err);
    res.status(500).json({ error: "Failed to retrieve subscription" });
  }
});

export default router;
