import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FREE_INVOICE_LIMIT, type BillingProfile } from '../lib/billing';

type User = {
  id: string;
  email?: string;
};

type BillingRouteState = {
  user: User | null;
  userError: Error | null;
  profile: BillingProfile | null;
  profileError: Error | null;
  invoiceCount: number | null;
  invoiceCountError: Error | null;
  upsertError: Error | null;
};

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

const stripeCalls = {
  customersCreate: vi.fn(),
  checkoutCreate: vi.fn(),
  portalCreate: vi.fn(),
};

let state: BillingRouteState;
let stripeConfigError: Error | null;

function resetState(overrides: Partial<BillingRouteState> = {}) {
  state = {
    user: { id: 'user_test', email: 'customer@example.com' },
    userError: null,
    profile: null,
    profileError: null,
    invoiceCount: 1,
    invoiceCountError: null,
    upsertError: null,
    ...overrides,
  };

  stripeCalls.customersCreate.mockResolvedValue({ id: 'cus_created' });
  stripeCalls.checkoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/session' });
  stripeCalls.portalCreate.mockResolvedValue({ url: 'https://billing.stripe.test/session' });
  stripeConfigError = null;
}

function billingProfile(overrides: Partial<BillingProfile> = {}): BillingProfile {
  return {
    user_id: 'user_test',
    stripe_customer_id: 'cus_existing',
    stripe_subscription_id: 'sub_existing',
    plan: 'free',
    status: 'free',
    current_period_end: null,
    ...overrides,
  };
}

function thenable<T>(result: T) {
  return {
    then(resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
}

function queryFor(table: string) {
  return {
    select() {
      const chain = {
        eq() {
          return chain;
        },
        gte() {
          return thenable({
            count: state.invoiceCount,
            error: state.invoiceCountError,
          });
        },
        maybeSingle: async () => {
          if (table === 'billing_profiles') {
            return {
              data: state.profile,
              error: state.profileError,
            };
          }

          return { data: null, error: null };
        },
      };

      return chain;
    },
    async upsert() {
      return { error: state.upsertError };
    },
  };
}

function makeSupabaseClient() {
  return {
    auth: {
      async getUser() {
        return {
          data: { user: state.user },
          error: state.userError,
        };
      },
    },
    from: queryFor,
  };
}

function request(path: string, init: NextRequestInit = {}) {
  return new NextRequest(`http://localhost:3028${path}`, init);
}

async function billingStatus() {
  const { GET } = await import('../app/api/billing/status/route');
  return GET();
}

async function billingCheckout(init: NextRequestInit = {}) {
  const { POST } = await import('../app/api/billing/checkout/route');
  return POST(request('/api/billing/checkout', { method: 'POST', ...init }));
}

async function billingPortal(init: NextRequestInit = {}) {
  const { POST } = await import('../app/api/billing/portal/route');
  return POST(request('/api/billing/portal', { method: 'POST', ...init }));
}

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://www.ihateinvoices.com');
  resetState();

  vi.doMock('@/lib/supabase-server', () => ({
    createSupabaseServerClient: async () => makeSupabaseClient(),
    createSupabaseAdminClient: () => makeSupabaseClient(),
  }));

  vi.doMock('@/lib/stripe', () => ({
    getProPriceId: () => 'price_test_pro',
    getStripe: () => {
      if (stripeConfigError) throw stripeConfigError;

      return {
        customers: {
          create: stripeCalls.customersCreate,
        },
        checkout: {
          sessions: {
            create: stripeCalls.checkoutCreate,
          },
        },
        billingPortal: {
          sessions: {
            create: stripeCalls.portalCreate,
          },
        },
      };
    },
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('@/lib/supabase-server');
  vi.doUnmock('@/lib/stripe');
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('billing API routes', () => {
  it('returns 401 from billing status when the user is not authenticated', async () => {
    resetState({ user: null });

    const response = await billingStatus();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns free billing status with usage for an authenticated user', async () => {
    resetState({ invoiceCount: 2 });

    const response = await billingStatus();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      plan: 'free',
      status: 'free',
      current_period_end: null,
      is_pro: false,
      free_invoice_limit: FREE_INVOICE_LIMIT,
      used_this_month: 2,
      remaining_this_month: 1,
    });
  });

  it('returns pro billing status without a remaining free limit', async () => {
    resetState({
      profile: billingProfile({
        plan: 'pro',
        status: 'active',
        current_period_end: '2026-07-01T00:00:00.000Z',
      }),
      invoiceCount: 8,
    });

    const response = await billingStatus();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      plan: 'pro',
      status: 'active',
      is_pro: true,
      used_this_month: 8,
      remaining_this_month: null,
    });
  });

  it('returns 403 from billing checkout for an invalid cross-origin POST', async () => {
    const response = await billingCheckout({
      headers: {
        origin: 'https://evil.example',
      },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request origin' });
  });

  it('creates a Stripe customer and Checkout session for a free user without a customer id', async () => {
    resetState({ profile: null });

    const response = await billingCheckout();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: 'https://checkout.stripe.test/session',
    });
    expect(stripeCalls.customersCreate).toHaveBeenCalledWith({
      email: 'customer@example.com',
      metadata: {
        user_id: 'user_test',
      },
    });
    expect(stripeCalls.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_created',
        client_reference_id: 'user_test',
        success_url: 'https://www.ihateinvoices.com/dashboard?checkout=success',
        cancel_url: 'https://www.ihateinvoices.com/dashboard?checkout=cancelled',
      })
    );
  });

  it('returns 503 from checkout when Stripe server configuration is missing', async () => {
    stripeConfigError = new Error('Missing required environment variable: STRIPE_SECRET_KEY');

    const response = await billingCheckout();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Payment setup is not configured yet.',
    });
    expect(stripeCalls.customersCreate).not.toHaveBeenCalled();
    expect(stripeCalls.checkoutCreate).not.toHaveBeenCalled();
  });

  it('opens the billing portal from checkout when the user is already Pro', async () => {
    resetState({
      profile: billingProfile({
        plan: 'pro',
        status: 'active',
        stripe_customer_id: 'cus_pro',
      }),
    });

    const response = await billingCheckout();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: 'https://billing.stripe.test/session',
    });
    expect(stripeCalls.checkoutCreate).not.toHaveBeenCalled();
    expect(stripeCalls.portalCreate).toHaveBeenCalledWith({
      customer: 'cus_pro',
      return_url: 'https://www.ihateinvoices.com/dashboard',
    });
  });

  it('returns 500 from checkout if preparing a new billing profile fails', async () => {
    resetState({
      profile: null,
      upsertError: new Error('upsert failed'),
    });

    const response = await billingCheckout();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to prepare billing profile',
    });
  });

  it('returns 400 from billing portal when no Stripe customer exists', async () => {
    resetState({ profile: null });

    const response = await billingPortal();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'No Stripe customer found' });
  });

  it('opens the billing portal for a user with a Stripe customer id', async () => {
    resetState({
      profile: billingProfile({
        stripe_customer_id: 'cus_portal',
      }),
    });

    const response = await billingPortal();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: 'https://billing.stripe.test/session',
    });
    expect(stripeCalls.portalCreate).toHaveBeenCalledWith({
      customer: 'cus_portal',
      return_url: 'https://www.ihateinvoices.com/dashboard',
    });
  });

  it('returns 503 from billing portal when Stripe server configuration is missing', async () => {
    resetState({
      profile: billingProfile({
        stripe_customer_id: 'cus_portal',
      }),
    });
    stripeConfigError = new Error('Missing required environment variable: STRIPE_SECRET_KEY');

    const response = await billingPortal();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Payment setup is not configured yet.',
    });
    expect(stripeCalls.portalCreate).not.toHaveBeenCalled();
  });
});
