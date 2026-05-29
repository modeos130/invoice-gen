import { NextRequest } from 'next/server';
import { createHmac } from 'node:crypto';
import Stripe from 'stripe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TestState = {
  eventInsertError: (Error & { code?: string }) | null;
  signature: string | null;
  inserts: Array<{ table: string; payload: Record<string, unknown> }>;
};

const webhookSecret = 'whsec_phase10_signed_fixture';
const stripe = new Stripe('sk_test_phase10', {
  apiVersion: '2026-03-25.dahlia',
});

let state: TestState;

function uniqueViolationError(): Error & { code: string } {
  return Object.assign(new Error('duplicate key value violates unique constraint'), {
    code: '23505',
  });
}

function createEventPayload(id: string, type = 'phase10.test'): string {
  return JSON.stringify({
    id,
    object: 'event',
    type,
    data: {
      object: {
        id: 'obj_phase10',
      },
    },
  });
}

function signPayload(payload: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex');

  return stripe.webhooks.generateTestHeaderString({
    timestamp,
    payload,
    secret: webhookSecret,
    scheme: 'v1',
    signature,
    cryptoProvider: Stripe.createNodeCryptoProvider(),
  });
}

function createRequest(payload: string): NextRequest {
  return new NextRequest('http://localhost:3028/api/stripe/webhook', {
    method: 'POST',
    body: payload,
  });
}

async function postWebhook(payload: string) {
  const { POST } = await import('../app/api/stripe/webhook/route');
  return POST(createRequest(payload));
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', webhookSecret);
  state = {
    eventInsertError: null,
    signature: null,
    inserts: [],
  };

  vi.doMock('next/headers', () => ({
    headers: async () => ({
      get(name: string) {
        return name.toLowerCase() === 'stripe-signature' ? state.signature : null;
      },
    }),
  }));

  vi.doMock('@/lib/stripe', () => ({
    getStripe: () => stripe,
  }));

  vi.doMock('@/lib/supabase-server', () => ({
    createSupabaseAdminClient: () => ({
      from(table: string) {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return {
                      data: null,
                      error: null,
                    };
                  },
                };
              },
            };
          },
          async insert(payload: Record<string, unknown>) {
            state.inserts.push({ table, payload });
            return { error: state.eventInsertError };
          },
          delete() {
            return {
              async eq() {
                return { error: null };
              },
            };
          },
        };
      },
    }),
  }));
});

afterEach(() => {
  vi.doUnmock('next/headers');
  vi.doUnmock('@/lib/stripe');
  vi.doUnmock('@/lib/supabase-server');
  vi.unstubAllEnvs();
});

describe('Stripe webhook route', () => {
  it('rejects requests without a Stripe signature', async () => {
    const response = await postWebhook(createEventPayload('evt_missing_signature'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing Stripe signature' });
    expect(state.inserts).toHaveLength(0);
  });

  it('rejects requests with an invalid Stripe signature', async () => {
    const payload = createEventPayload('evt_bad_signature');
    state.signature = 'bad-signature';

    const response = await postWebhook(payload);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid Stripe signature' });
    expect(state.inserts).toHaveLength(0);
  });

  it('accepts a Stripe SDK-signed fixture and records the processed event', async () => {
    const payload = createEventPayload('evt_signed_fixture');
    state.signature = signPayload(payload);

    const response = await postWebhook(payload);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(state.inserts).toEqual([
      {
        table: 'stripe_webhook_events',
        payload: {
          id: 'evt_signed_fixture',
          type: 'phase10.test',
        },
      },
    ]);
  });

  it('accepts a signed duplicate fixture without syncing it again', async () => {
    const payload = createEventPayload('evt_duplicate_fixture');
    state.signature = signPayload(payload);
    state.eventInsertError = uniqueViolationError();

    const response = await postWebhook(payload);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, duplicate: true });
    expect(state.inserts).toEqual([
      {
        table: 'stripe_webhook_events',
        payload: {
          id: 'evt_duplicate_fixture',
          type: 'phase10.test',
        },
      },
    ]);
  });
});
