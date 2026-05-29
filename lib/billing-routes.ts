import type Stripe from 'stripe';
import {
  FREE_INVOICE_LIMIT,
  isProEntitled,
  type BillingProfile,
} from './billing';
import { getBaseUrl } from './server-env';

export type BillingStatusPayload = {
  plan: BillingProfile['plan'];
  status: string;
  current_period_end: string | null;
  is_pro: boolean;
  free_invoice_limit: number;
  used_this_month: number;
  remaining_this_month: number | null;
};

export type ProCheckoutSessionOptions = {
  customerId: string;
  userId: string;
  priceId: string;
  origin?: string;
};

export function buildBillingStatusPayload(
  billingProfile: BillingProfile | null,
  usedThisMonth: number
): BillingStatusPayload {
  const isPro = isProEntitled(billingProfile);
  const normalizedUsage = Number.isFinite(usedThisMonth)
    ? Math.max(Math.floor(usedThisMonth), 0)
    : 0;

  return {
    plan: billingProfile?.plan ?? 'free',
    status: billingProfile?.status ?? 'free',
    current_period_end: billingProfile?.current_period_end ?? null,
    is_pro: isPro,
    free_invoice_limit: FREE_INVOICE_LIMIT,
    used_this_month: normalizedUsage,
    remaining_this_month: isPro
      ? null
      : Math.max(FREE_INVOICE_LIMIT - normalizedUsage, 0),
  };
}

export function buildBillingPortalSessionParams(
  customerId: string,
  origin?: string
): Stripe.BillingPortal.SessionCreateParams {
  return {
    customer: customerId,
    return_url: `${getBaseUrl(origin)}/dashboard`,
  };
}

export function buildProCheckoutSessionParams({
  customerId,
  userId,
  priceId,
  origin,
}: ProCheckoutSessionOptions): Stripe.Checkout.SessionCreateParams {
  const baseUrl = getBaseUrl(origin);

  return {
    mode: 'subscription',
    customer: customerId,
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=cancelled`,
    metadata: {
      user_id: userId,
      plan: 'pro',
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan: 'pro',
      },
    },
  };
}
