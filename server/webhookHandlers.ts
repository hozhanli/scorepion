import Stripe from "stripe";
import { getStripeClient } from "./stripeClient";
import * as userRepo from "./repositories/user.repository";

export class WebhookHandlers {
  /**
   * Verify and process a Stripe webhook event.
   *
   * Requires STRIPE_WEBHOOK_SECRET to be set so we can verify the signature.
   * Without it, we still parse but skip signature verification (dev-only).
   */
  static async processWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Received type: " +
          typeof payload +
          ". " +
          "This usually means express.json() parsed the body before reaching this handler. " +
          "FIX: Ensure webhook route is registered BEFORE app.use(express.json()).",
      );
    }

    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      console.warn(
        "[Stripe] STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev only)",
      );
      event = JSON.parse(payload.toString()) as Stripe.Event;
    }

    await WebhookHandlers.handleEvent(event);
  }

  private static async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const isActive = ["active", "trialing"].includes(subscription.status);
        await userRepo.updateUserSubscription(
          customerId,
          subscription.id,
          isActive,
        );
        console.log(
          `[Stripe] Subscription ${subscription.id} → ${subscription.status}`,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await userRepo.updateUserSubscription(
          customerId,
          subscription.id,
          false,
        );
        console.log(`[Stripe] Subscription ${subscription.id} cancelled`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.customer && session.subscription) {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer.id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          await userRepo.updateUserSubscription(
            customerId,
            subscriptionId,
            true,
          );
          console.log(`[Stripe] Checkout completed for ${customerId}`);
        }
        break;
      }

      default:
        // Unhandled event type — log for debugging
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
  }
}
