import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBillingPortalSessionParams,
  buildBillingStatusPayload,
  buildProCheckoutSessionParams,
} from '../lib/billing-routes';
import { FREE_INVOICE_LIMIT, type BillingProfile } from '../lib/billing';

afterEach(() => {
  vi.unstubAllEnvs();
});

const proProfile: BillingProfile = {
  user_id: 'user_test',
  stripe_customer_id: 'cus_test',
  stripe_subscription_id: 'sub_test',
  plan: 'pro',
  status: 'active',
  current_period_end: '2026-06-29T00:00:00.000Z',
};

describe('billing route helpers', () => {
  it('builds the free billing status payload with remaining invoice usage', () => {
    expect(buildBillingStatusPayload(null, 2)).toEqual({
      plan: 'free',
      status: 'free',
      current_period_end: null,
      is_pro: false,
      free_invoice_limit: FREE_INVOICE_LIMIT,
      used_this_month: 2,
      remaining_this_month: 1,
    });
  });

  it('clamps free billing status usage values for display', () => {
    expect(buildBillingStatusPayload(null, 99).remaining_this_month).toBe(0);
    expect(buildBillingStatusPayload(null, -2)).toMatchObject({
      used_this_month: 0,
      remaining_this_month: FREE_INVOICE_LIMIT,
    });
    expect(buildBillingStatusPayload(null, Number.NaN)).toMatchObject({
      used_this_month: 0,
      remaining_this_month: FREE_INVOICE_LIMIT,
    });
  });

  it('builds the pro billing status payload without a remaining free limit', () => {
    expect(buildBillingStatusPayload(proProfile, 8)).toEqual({
      plan: 'pro',
      status: 'active',
      current_period_end: '2026-06-29T00:00:00.000Z',
      is_pro: true,
      free_invoice_limit: FREE_INVOICE_LIMIT,
      used_this_month: 8,
      remaining_this_month: null,
    });
  });

  it('builds Stripe portal session params using the request origin in local mode', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');

    expect(buildBillingPortalSessionParams('cus_test', 'http://localhost:3028')).toEqual({
      customer: 'cus_test',
      return_url: 'http://localhost:3028/dashboard',
    });
  });

  it('builds Stripe checkout session params with subscription metadata', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');

    const params = buildProCheckoutSessionParams({
      customerId: 'cus_test',
      userId: 'user_test',
      priceId: 'price_test',
      origin: 'http://localhost:3028',
    });

    expect(params).toMatchObject({
      mode: 'subscription',
      customer: 'cus_test',
      client_reference_id: 'user_test',
      allow_promotion_codes: true,
      success_url: 'http://localhost:3028/dashboard?checkout=success',
      cancel_url: 'http://localhost:3028/dashboard?checkout=cancelled',
      metadata: {
        user_id: 'user_test',
        plan: 'pro',
      },
      subscription_data: {
        metadata: {
          user_id: 'user_test',
          plan: 'pro',
        },
      },
    });
    expect(params.line_items).toEqual([{ price: 'price_test', quantity: 1 }]);
  });

  it('uses configured app URL over request origin for Stripe return URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://www.ihateinvoices.com/');

    expect(buildBillingPortalSessionParams('cus_test', 'http://localhost:3028').return_url).toBe(
      'https://www.ihateinvoices.com/dashboard'
    );
    expect(
      buildProCheckoutSessionParams({
        customerId: 'cus_test',
        userId: 'user_test',
        priceId: 'price_test',
        origin: 'http://localhost:3028',
      }).success_url
    ).toBe('https://www.ihateinvoices.com/dashboard?checkout=success');
  });
});
