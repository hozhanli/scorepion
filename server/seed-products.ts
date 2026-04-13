import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'Scorepion Premium'" });
  if (existing.data.length > 0) {
    console.log('Scorepion Premium product already exists:', existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    prices.data.forEach(p => {
      console.log(`  Price: ${p.id} - ${p.unit_amount! / 100} ${p.currency}/${p.recurring?.interval}`);
    });
    return;
  }

  const product = await stripe.products.create({
    name: 'Scorepion Premium',
    description: 'Unlock unlimited predictions, advanced stats, ad-free experience, and exclusive features',
    metadata: {
      tier: 'premium',
      app: 'scorepion',
    },
  });

  console.log('Created product:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 399,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'monthly' },
  });

  console.log('Created monthly price:', monthlyPrice.id, '- $3.99/month');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 2999,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'yearly' },
  });

  console.log('Created yearly price:', yearlyPrice.id, '- $29.99/year');
}

createProducts().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
