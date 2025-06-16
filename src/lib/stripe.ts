import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripePromise = loadStripe(stripePublishableKey);

export const STRIPE_PRICE_IDS = {
  Pro: 'price_1234567890', // Replace with your actual Stripe price IDs
  Plus: 'price_0987654321', // Replace with your actual Stripe price IDs
} as const;

export const STRIPE_PRODUCT_IDS = {
  Pro: 'prod_1234567890', // Replace with your actual Stripe product IDs
  Plus: 'prod_0987654321', // Replace with your actual Stripe product IDs
} as const;