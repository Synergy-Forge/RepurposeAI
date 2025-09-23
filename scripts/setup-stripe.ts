import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

async function createProductsAndPrices() {
  try {
    // Free Plan
    const freePlan = await stripe.products.create({
      name: 'Free Plan',
      description: 'Basic video repurposing plan',
    });

    const freePriceMonthly = await stripe.prices.create({
      product: freePlan.id,
      unit_amount: 0,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    // Starter Plan
    const starterPlan = await stripe.products.create({
      name: 'Starter Plan',
      description: 'Standard video repurposing plan',
    });

    const starterPriceMonthly = await stripe.prices.create({
      product: starterPlan.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const starterPriceYearly = await stripe.prices.create({
      product: starterPlan.id,
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: { interval: 'year' },
    });

    // Creator Plan
    const creatorPlan = await stripe.products.create({
      name: 'Creator Plan',
      description: 'Premium video repurposing plan',
    });

    const creatorPriceMonthly = await stripe.prices.create({
      product: creatorPlan.id,
      unit_amount: 2499, // $24.99
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const creatorPriceYearly = await stripe.prices.create({
      product: creatorPlan.id,
      unit_amount: 24900, // $249.00
      currency: 'usd',
      recurring: { interval: 'year' },
    });

    // Producer Plan
    const producerPlan = await stripe.products.create({
      name: 'Producer Plan',
      description: 'Professional video repurposing plan',
    });

    const producerPriceMonthly = await stripe.prices.create({
      product: producerPlan.id,
      unit_amount: 6999, // $69.99
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const producerPriceYearly = await stripe.prices.create({
      product: producerPlan.id,
      unit_amount: 69900, // $699.00
      currency: 'usd',
      recurring: { interval: 'year' },
    });

    console.log('Price IDs for your .env file:');
    console.log('\nFree Plan:');
    console.log(`STRIPE_FREE_PRICE_ID=${freePriceMonthly.id}`);
    
    console.log('\nStarter Plan:');
    console.log(`STRIPE_STARTER_MONTHLY_PRICE_ID=${starterPriceMonthly.id}`);
    console.log(`STRIPE_STARTER_YEARLY_PRICE_ID=${starterPriceYearly.id}`);
    
    console.log('\nCreator Plan:');
    console.log(`STRIPE_CREATOR_MONTHLY_PRICE_ID=${creatorPriceMonthly.id}`);
    console.log(`STRIPE_CREATOR_YEARLY_PRICE_ID=${creatorPriceYearly.id}`);
    
    console.log('\nProducer Plan:');
    console.log(`STRIPE_PRODUCER_MONTHLY_PRICE_ID=${producerPriceMonthly.id}`);
    console.log(`STRIPE_PRODUCER_YEARLY_PRICE_ID=${producerPriceYearly.id}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

createProductsAndPrices();
