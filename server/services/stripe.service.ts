/**
 * Stripe integration — scaffold only. Actual premium features aren't live.
 *
 * Activation steps when product decides on paid tiers:
 *   1. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY in .env
 *   2. Create products + prices in Stripe Dashboard, paste price IDs into PRICE_IDS below
 *   3. Flip ENABLE_BILLING=true
 *   4. Add upgrade UI to the client (Profile screen → "Go Premium")
 */

import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const ENABLE_BILLING = process.env.ENABLE_BILLING === "true";

export const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "",
  premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? "",
};

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient && STRIPE_SECRET) {
    stripeClient = new Stripe(STRIPE_SECRET, {
      apiVersion: "2025-11-17.clover" as Stripe.LatestApiVersion,
    });
  }
  if (!stripeClient) {
    throw new Error("Stripe client not initialized. Check STRIPE_SECRET_KEY env var.");
  }
  return stripeClient;
}

export function isBillingEnabled(): boolean {
  return ENABLE_BILLING && !!STRIPE_SECRET;
}

/**
 * Create a Checkout session for the user to upgrade.
 * Returns the session ID; client redirects to Stripe-hosted checkout.
 */
export async function createCheckoutSession(
  userId: string,
  priceKey: keyof typeof PRICE_IDS,
  returnUrl: string,
): Promise<string> {
  if (!isBillingEnabled()) {
    throw new Error("Billing is not enabled");
  }

  const priceId = PRICE_IDS[priceKey];
  if (!priceId) {
    throw new Error(`Price ID not configured for ${priceKey}`);
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    customer_email: undefined, // Will be set from user context in routes
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: {
      user_id: userId,
    },
  });

  if (!session.id) {
    throw new Error("Failed to create Stripe session");
  }

  return session.id;
}

/**
 * Verify webhook signature and dispatch to handlers.
 */
export async function handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
  if (!isBillingEnabled() || !WEBHOOK_SECRET) {
    throw new Error("Billing or webhook secret not configured");
  }

  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${(err as Error).message}`);
  }

  // Dispatch based on event type
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      // Log but don't fail on unknown events
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  // Write to DB: insert/update subscriptions + billingEvents
  // (Implementation deferred until billing is activated)
  console.log(`Subscription change: ${subscription.id} status=${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  // Write to DB: mark subscription as canceled
  console.log(`Subscription deleted: ${subscription.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Write to DB: log payment failure event
  console.log(`Invoice payment failed: ${invoice.id}`);
}

/**
 * Retrieve current subscription status for a user (from DB).
 * Returns null if no active subscription.
 */
export async function getUserSubscription(userId: string): Promise<any | null> {
  // TODO: query DB subscriptions table
  // For now, return null (no active subscriptions until billing is activated)
  return null;
}

/**
 * Legacy/stub exports for backwards compatibility with existing stripe.routes.ts
 * These are disabled when ENABLE_BILLING=false
 */

export async function getStripeConfig(): Promise<any> {
  if (!isBillingEnabled()) {
    return { error: "Billing is not yet available", code: "NOT_IMPLEMENTED" };
  }
  return { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "" };
}

export async function getStripeProducts(): Promise<any> {
  if (!isBillingEnabled()) {
    return { error: "Billing is not yet available", code: "NOT_IMPLEMENTED" };
  }
  // TODO: fetch from Stripe API
  return [];
}

export async function handleCheckoutSuccess(sessionId: string): Promise<any> {
  if (!isBillingEnabled()) {
    return { error: "Billing is not yet available", code: "NOT_IMPLEMENTED" };
  }
  // TODO: update user subscription in DB
}

export async function getSubscriptionStatus(user: any): Promise<any> {
  if (!isBillingEnabled()) {
    return { subscription: null, isPremium: false };
  }
  // TODO: query DB
  return { subscription: null, isPremium: false };
}

export async function createBillingPortalSession(user: any): Promise<any> {
  if (!isBillingEnabled()) {
    return { error: "Billing is not yet available", code: "NOT_IMPLEMENTED" };
  }
  // TODO: create Stripe billing portal session
  return { error: "Billing is not yet available", code: "NOT_IMPLEMENTED" };
}
