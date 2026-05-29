import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import {
  processStripeWebhookEvent,
  stripeId,
  subscriptionPeriodEnd,
  syncCheckoutSession,
  syncSubscription,
  type StripeWebhookAdminClient,
} from '../lib/stripe-webhook';

function fakeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_test',
    customer: 'cus_test',
    metadata: { user_id: 'user_test' },
    status: 'active',
    items: {
      data: [{ current_period_end: 1_800_000_000 }],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function fakeCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return {
    id: 'cs_test',
    mode: 'subscription',
    subscription: 'sub_test',
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function fakeEvent(type: string, object: unknown, id = 'evt_test'): Stripe.Event {
  return {
    id,
    type,
    data: { object },
  } as Stripe.Event;
}

function uniqueViolationError(): Error & { code: string } {
  return Object.assign(new Error('duplicate key value violates unique constraint'), {
    code: '23505',
  });
}

function createAdmin(options: {
  lookupUserId?: string | null;
  upsertError?: Error | null;
  insertError?: Error | null;
  eventInsertError?: Error | null;
  deleteError?: Error | null;
} = {}) {
  const calls = {
    lookups: [] as Array<{ table: string; column: string; value: string }>,
    upserts: [] as Array<{ table: string; payload: Record<string, unknown> }>,
    inserts: [] as Array<{ table: string; payload: Record<string, unknown> }>,
    deletes: [] as Array<{ table: string; column: string; value: string }>,
  };

  const client: StripeWebhookAdminClient = {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              return {
                async maybeSingle() {
                  calls.lookups.push({ table, column, value });

                  if (table === 'stripe_webhook_events') {
                    return {
                      data: null,
                      error: null,
                    };
                  }

                  if (table === 'billing_profiles') {
                    return {
                      data: options.lookupUserId ? { user_id: options.lookupUserId } : null,
                      error: null,
                    };
                  }

                  return { data: null, error: null };
                },
              };
            },
          };
        },
        async upsert(payload: Record<string, unknown>) {
          calls.upserts.push({ table, payload });
          return { error: options.upsertError ?? null };
        },
        async insert(payload: Record<string, unknown>) {
          calls.inserts.push({ table, payload });
          if (table === 'stripe_webhook_events') {
            return { error: options.eventInsertError ?? null };
          }
          return { error: options.insertError ?? null };
        },
        delete() {
          return {
            async eq(column: string, value: string) {
              calls.deletes.push({ table, column, value });
              return { error: options.deleteError ?? null };
            },
          };
        },
      };
    },
  };

  return { client, calls };
}

describe('Stripe webhook helpers', () => {
  it('normalizes Stripe ids from strings, objects, and missing values', () => {
    expect(stripeId('cus_123')).toBe('cus_123');
    expect(stripeId({ id: 'cus_456' })).toBe('cus_456');
    expect(stripeId(null)).toBeNull();
  });

  it('returns the subscription item period end as an ISO string', () => {
    expect(subscriptionPeriodEnd(fakeSubscription())).toBe('2027-01-15T08:00:00.000Z');
    expect(
      subscriptionPeriodEnd(
        fakeSubscription({ items: { data: [] } as unknown as Stripe.Subscription['items'] })
      )
    ).toBeNull();
  });

  it('syncs an active subscription to a Pro billing profile using metadata user id', async () => {
    const { client, calls } = createAdmin();

    await syncSubscription(fakeSubscription(), client, {
      now: () => new Date('2026-05-29T12:00:00.000Z'),
    });

    expect(calls.upserts).toHaveLength(1);
    expect(calls.upserts[0]).toEqual({
      table: 'billing_profiles',
      payload: {
        user_id: 'user_test',
        stripe_customer_id: 'cus_test',
        stripe_subscription_id: 'sub_test',
        plan: 'pro',
        status: 'active',
        current_period_end: '2027-01-15T08:00:00.000Z',
        updated_at: '2026-05-29T12:00:00.000Z',
      },
    });
  });

  it('falls back to customer lookup when subscription metadata has no user id', async () => {
    const { client, calls } = createAdmin({ lookupUserId: 'user_from_profile' });

    await syncSubscription(
      fakeSubscription({
        metadata: {},
      }),
      client
    );

    expect(calls.lookups).toContainEqual({
      table: 'billing_profiles',
      column: 'stripe_customer_id',
      value: 'cus_test',
    });
    expect(calls.upserts[0].payload.user_id).toBe('user_from_profile');
  });

  it('maps non-entitled subscription statuses back to the free plan', async () => {
    const { client, calls } = createAdmin();

    await syncSubscription(fakeSubscription({ status: 'canceled' }), client);

    expect(calls.upserts[0].payload.plan).toBe('free');
    expect(calls.upserts[0].payload.status).toBe('canceled');
  });

  it('fails closed when a subscription cannot be tied to a user', async () => {
    const { client } = createAdmin();

    await expect(
      syncSubscription(fakeSubscription({ customer: undefined, metadata: {} }), client)
    ).rejects.toThrow('No user_id found for subscription sub_test');
  });

  it('retrieves and syncs subscriptions from completed checkout sessions', async () => {
    const { client, calls } = createAdmin();
    const stripe = {
      subscriptions: {
        retrieve: vi.fn(async () => fakeSubscription()),
      },
    };

    await syncCheckoutSession(fakeCheckoutSession(), client, stripe);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test');
    expect(calls.upserts).toHaveLength(1);
  });

  it('does not reprocess duplicate Stripe events', async () => {
    const { client, calls } = createAdmin({ eventInsertError: uniqueViolationError() });

    const result = await processStripeWebhookEvent(
      fakeEvent('customer.subscription.updated', fakeSubscription()),
      client,
      { subscriptions: { retrieve: vi.fn() } }
    );

    expect(result).toEqual({ received: true, duplicate: true });
    expect(calls.upserts).toHaveLength(0);
    expect(calls.inserts).toEqual([
      {
        table: 'stripe_webhook_events',
        payload: { id: 'evt_test', type: 'customer.subscription.updated' },
      },
    ]);
  });

  it('records a processed event after entitlement sync succeeds', async () => {
    const { client, calls } = createAdmin();

    const result = await processStripeWebhookEvent(
      fakeEvent('customer.subscription.updated', fakeSubscription(), 'evt_sync'),
      client,
      { subscriptions: { retrieve: vi.fn() } }
    );

    expect(result).toEqual({ received: true });
    expect(calls.upserts).toHaveLength(1);
    expect(calls.inserts).toEqual([
      {
        table: 'stripe_webhook_events',
        payload: { id: 'evt_sync', type: 'customer.subscription.updated' },
      },
    ]);
  });

  it('fails webhook processing when the event claim insert fails', async () => {
    const { client, calls } = createAdmin({ eventInsertError: new Error('insert failed') });

    await expect(
      processStripeWebhookEvent(
        fakeEvent('customer.subscription.updated', fakeSubscription()),
        client,
        { subscriptions: { retrieve: vi.fn() } }
      )
    ).rejects.toThrow('insert failed');
    expect(calls.upserts).toHaveLength(0);
  });

  it('releases a claimed event when entitlement sync fails', async () => {
    const { client, calls } = createAdmin({ upsertError: new Error('upsert failed') });

    await expect(
      processStripeWebhookEvent(
        fakeEvent('customer.subscription.updated', fakeSubscription(), 'evt_sync_fail'),
        client,
        { subscriptions: { retrieve: vi.fn() } }
      )
    ).rejects.toThrow('upsert failed');

    expect(calls.inserts).toEqual([
      {
        table: 'stripe_webhook_events',
        payload: { id: 'evt_sync_fail', type: 'customer.subscription.updated' },
      },
    ]);
    expect(calls.deletes).toEqual([
      {
        table: 'stripe_webhook_events',
        column: 'id',
        value: 'evt_sync_fail',
      },
    ]);
  });
});
