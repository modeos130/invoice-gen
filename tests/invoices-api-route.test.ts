import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FREE_INVOICE_LIMIT, type BillingProfile } from '../lib/billing';

type User = {
  id: string;
  email?: string;
};

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
};

type InvoicesRouteState = {
  user: User | null;
  userError: Error | null;
  profile: Pick<BillingProfile, 'plan' | 'status'> | null;
  profileError: Error | null;
  monthlyCount: number | null;
  monthlyCountError: Error | null;
  totalInvoiceCount: number | null;
  totalInvoiceCountError: Error | null;
  selectedClient: ClientRow | null;
  selectedClientError: Error | null;
  newClient: { id: string } | null;
  newClientError: Error | null;
  insertedInvoice: { id: string; invoice_number: string } | null;
  insertedInvoiceError: Error | null;
  rpcInvoice: { id: string; invoice_number: string } | null;
  rpcError: Error | null;
  rpcCalls: Array<{ functionName: string; params: Record<string, unknown> }>;
  clientInserts: Array<Record<string, unknown>>;
  invoiceInserts: Array<Record<string, unknown>>;
};

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

let state: InvoicesRouteState;

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    client_name: 'Acme Studio',
    client_email: 'billing@example.com',
    client_address: '123 Main St',
    line_items: [{ description: 'Mix revision', quantity: 2, rate: 150 }],
    tax_rate: 5,
    notes: 'Thank you.',
    invoice_date: '2026-05-29',
    due_date: '2026-06-28',
    ...overrides,
  };
}

function resetState(overrides: Partial<InvoicesRouteState> = {}) {
  state = {
    user: { id: 'user_invoice', email: 'customer@example.com' },
    userError: null,
    profile: null,
    profileError: null,
    monthlyCount: 0,
    monthlyCountError: null,
    totalInvoiceCount: 4,
    totalInvoiceCountError: null,
    selectedClient: null,
    selectedClientError: null,
    newClient: { id: 'client_created' },
    newClientError: null,
    insertedInvoice: { id: 'invoice_created', invoice_number: 'INV-2026-005' },
    insertedInvoiceError: null,
    rpcInvoice: { id: 'invoice_rpc', invoice_number: 'INV-2026-011' },
    rpcError: null,
    rpcCalls: [],
    clientInserts: [],
    invoiceInserts: [],
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

function selectQuery(table: string, _columns: string, options?: { count?: string; head?: boolean }) {
  const chain = {
    eq() {
      return chain;
    },
    gte() {
      return thenable({
        count: state.monthlyCount,
        error: state.monthlyCountError,
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
    single: async () => {
      if (table === 'clients') {
        return {
          data: state.selectedClient,
          error: state.selectedClientError,
        };
      }

      return { data: null, error: null };
    },
    then(resolve: (value: { count: number | null; error: Error | null }) => unknown, reject?: (reason: unknown) => unknown) {
      const isCountQuery = options?.count === 'exact' && options.head === true;
      const result = isCountQuery
        ? { count: state.totalInvoiceCount, error: state.totalInvoiceCountError }
        : { count: null, error: null };

      return Promise.resolve(result).then(resolve, reject);
    },
  };

  return chain;
}

function insertQuery(table: string, payload: Record<string, unknown>) {
  if (table === 'clients') {
    state.clientInserts.push(payload);
  }

  if (table === 'invoices') {
    state.invoiceInserts.push(payload);
  }

  return {
    select() {
      return {
        async single() {
          if (table === 'clients') {
            return {
              data: state.newClient,
              error: state.newClientError,
            };
          }

          if (table === 'invoices') {
            return {
              data: state.insertedInvoice,
              error: state.insertedInvoiceError,
            };
          }

          return { data: null, error: null };
        },
      };
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
    from(table: string) {
      return {
        select: (columns: string, options?: { count?: string; head?: boolean }) =>
          selectQuery(table, columns, options),
        insert: (payload: Record<string, unknown>) => insertQuery(table, payload),
      };
    },
    rpc(functionName: string, params: Record<string, unknown>) {
      state.rpcCalls.push({ functionName, params });
      return {
        async single() {
          return {
            data: state.rpcInvoice,
            error: state.rpcError,
          };
        },
      };
    },
  };
}

function createRequest(payload: unknown, init: NextRequestInit = {}) {
  return new NextRequest('http://localhost:3028/api/invoices', {
    method: 'POST',
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    ...init,
  });
}

async function postInvoice(payload: unknown, init: NextRequestInit = {}) {
  const { POST } = await import('../app/api/invoices/route');
  return POST(createRequest(payload, init));
}

beforeEach(() => {
  vi.resetModules();
  resetState();

  vi.doMock('@/lib/supabase-server', () => ({
    createSupabaseServerClient: async () => makeSupabaseClient(),
  }));
});

afterEach(() => {
  vi.doUnmock('@/lib/supabase-server');
  vi.unstubAllEnvs();
});

describe('invoice API route', () => {
  it('returns 403 for an invalid cross-origin POST', async () => {
    const response = await postInvoice(validPayload(), {
      headers: {
        origin: 'https://evil.example',
      },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request origin' });
  });

  it('returns 401 when the user is not authenticated', async () => {
    resetState({ user: null });

    const response = await postInvoice(validPayload());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 for an invalid invoice payload after auth succeeds', async () => {
    const response = await postInvoice(validPayload({ line_items: [] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Add at least one valid line item.',
    });
  });

  it('returns 402 when a free user has reached the monthly invoice limit', async () => {
    resetState({ monthlyCount: FREE_INVOICE_LIMIT });

    const response = await postInvoice(validPayload());

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: 'Free plan limit reached. Upgrade to Pro for unlimited invoices.',
      code: 'FREE_LIMIT_REACHED',
    });
  });

  it('returns 400 when a selected client is not owned by the user', async () => {
    resetState({
      selectedClient: null,
      selectedClientError: new Error('not found'),
    });

    const response = await postInvoice(
      validPayload({
        client_id: 'client_foreign',
        client_name: '',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Selected client was not found.',
    });
  });

  it('creates a client and saves an invoice for a valid free user request', async () => {
    const response = await postInvoice(validPayload());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: 'invoice_created',
      invoice_number: 'INV-2026-005',
    });
    expect(state.clientInserts).toEqual([
      {
        user_id: 'user_invoice',
        name: 'Acme Studio',
        email: 'billing@example.com',
        address: '123 Main St',
      },
    ]);
    expect(state.invoiceInserts[0]).toMatchObject({
      user_id: 'user_invoice',
      invoice_number: expect.stringMatching(/^INV-\d{4}-005$/),
      client_name: 'Acme Studio',
      client_email: 'billing@example.com',
      client_address: '123 Main St',
      client_id: 'client_created',
      subtotal: 300,
      tax_rate: 5,
      tax_amount: 15,
      total: 315,
      status: 'draft',
      notes: 'Thank you.',
      invoice_date: '2026-05-29',
      due_date: '2026-06-28',
    });
  });

  it('uses the atomic invoice RPC when the feature flag is enabled', async () => {
    vi.stubEnv('INVOICE_CREATE_RPC_ENABLED', 'true');

    const response = await postInvoice(validPayload());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: 'invoice_rpc',
      invoice_number: 'INV-2026-011',
    });
    expect(state.rpcCalls).toEqual([
      {
        functionName: 'create_invoice_atomic',
        params: expect.objectContaining({
          p_client_id: null,
          p_client_name: 'Acme Studio',
          p_client_email: 'billing@example.com',
          p_client_address: '123 Main St',
          p_subtotal: 300,
          p_tax_rate: 5,
          p_tax_amount: 15,
          p_total: 315,
          p_notes: 'Thank you.',
          p_invoice_date: '2026-05-29',
          p_due_date: '2026-06-28',
          p_free_invoice_limit: FREE_INVOICE_LIMIT,
        }),
      },
    ]);
    expect(state.clientInserts).toHaveLength(0);
    expect(state.invoiceInserts).toHaveLength(0);
  });

  it('maps the atomic invoice RPC free-limit error to the existing 402 response', async () => {
    vi.stubEnv('INVOICE_CREATE_RPC_ENABLED', 'true');
    resetState({
      rpcInvoice: null,
      rpcError: new Error('FREE_LIMIT_REACHED'),
    });

    const response = await postInvoice(validPayload());

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: 'Free plan limit reached. Upgrade to Pro for unlimited invoices.',
      code: 'FREE_LIMIT_REACHED',
    });
  });
});
