import Stripe from 'stripe';

interface StripeCredentials {
  publishableKey: string;
  secretKey: string;
}

let cachedCredentials: StripeCredentials | null = null;

function getCredentials(): StripeCredentials {
  if (cachedCredentials) return cachedCredentials;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    throw new Error(
      'Missing Stripe credentials. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables.'
    );
  }

  cachedCredentials = { publishableKey, secretKey };
  return cachedCredentials;
}

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const { secretKey } = getCredentials();
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover' as Stripe.LatestApiVersion,
    });
  }
  return stripeInstance;
}

/** Creates a fresh Stripe client (useful when credentials might rotate). */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = getCredentials();
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover' as Stripe.LatestApiVersion,
  });
}

export async function getStripePublishableKey(): Promise<string> {
  return getCredentials().publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  return getCredentials().secretKey;
}
