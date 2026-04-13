import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";
import * as userRepo from "../repositories/user.repository";

export async function getStripeConfig() {
    const publishableKey = await getStripePublishableKey();
    return { publishableKey };
}

export async function getStripeProducts() {
    const stripe = await getUncachableStripeClient();
    const products = await stripe.products.list({ active: true, limit: 10 });
    const prices = await stripe.prices.list({ active: true, limit: 50 });

    return products.data.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
        prices: prices.data
            .filter(p => p.product === product.id)
            .map(p => ({
                id: p.id,
                unitAmount: p.unit_amount,
                currency: p.currency,
                recurring: p.recurring,
            }))
            .sort((a, b) => (a.unitAmount || 0) - (b.unitAmount || 0)),
    }));
}

export async function createCheckoutSession(user: any, priceId: string) {
    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            metadata: { userId: user.id, username: user.username },
        });
        customerId = customer.id;
        await userRepo.updateUserStripeCustomer(user.id, customerId);
    }

    const baseUrl = (process.env.APP_URL || `http://localhost:${process.env.PORT || '5000'}`).replace(/\/+$/, '');
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/api/stripe/cancel`,
    });

    return { url: session.url };
}

export async function handleCheckoutSuccess(sessionId: string) {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.customer && session.subscription) {
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        await userRepo.updateUserSubscription(customerId, subscriptionId, true);
    }
}

export async function getSubscriptionStatus(user: any) {
    if (!user.stripeSubscriptionId) {
        return { subscription: null, isPremium: user.isPremium };
    }

    const subscription = await userRepo.getSubscriptionRow(user.stripeSubscriptionId);
    const isActive = subscription && ['active', 'trialing'].includes(subscription.status);

    if (user.isPremium !== isActive) {
        await userRepo.updateUserPremiumStatus(user.id, !!isActive);
    }

    return { subscription, isPremium: isActive };
}

export async function createBillingPortalSession(user: any) {
    if (!user.stripeCustomerId) {
        throw new Error("No Stripe customer found");
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = (process.env.APP_URL || `http://localhost:${process.env.PORT || '5000'}`).replace(/\/+$/, '');
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: baseUrl,
    });

    return { url: portalSession.url };
}
