import Stripe from 'stripe';
import { requireServerEnv } from '@/lib/server-env';

let stripe: Stripe | null = null;

export function getStripe() {
  if (!stripe) {
    stripe = new Stripe(requireServerEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  return stripe;
}

export function getProPriceId() {
  return requireServerEnv('STRIPE_PRO_PRICE_ID');
}
