import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type User = {
  id: string;
  email?: string;
};

type ArchiveRouteState = {
  user: User | null;
  userError: Error | null;
  updateResult: { id: string; archived_at: string | null } | null;
  updateError: Error | null;
  updates: Array<{ table: string; payload: Record<string, unknown> }>;
  filters: Array<{ table: string; column: string; value: string }>;
};

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

const validId = '123e4567-e89b-12d3-a456-426614174000';
let state: ArchiveRouteState;

function resetState(overrides: Partial<ArchiveRouteState> = {}) {
  state = {
    user: { id: 'user_archive', email: 'customer@example.com' },
    userError: null,
    updateResult: { id: validId, archived_at: '2026-05-29T17:55:00.000Z' },
    updateError: null,
    updates: [],
    filters: [],
    ...overrides,
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
        update(payload: Record<string, unknown>) {
          state.updates.push({ table, payload });

          const chain = {
            eq(column: string, value: string) {
              state.filters.push({ table, column, value });
              return chain;
            },
            select() {
              return {
                async maybeSingle() {
                  return {
                    data: state.updateResult,
                    error: state.updateError,
                  };
                },
              };
            },
          };

          return chain;
        },
      };
    },
  };
}

function request(path: string, payload: unknown, init: NextRequestInit = {}) {
  return new NextRequest(`http://localhost:3028${path}`, {
    method: 'POST',
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    ...init,
  });
}

async function postInvoiceArchive(
  id = validId,
  payload: unknown = { archived: true },
  init: NextRequestInit = {}
) {
  const { POST } = await import('../app/api/invoices/[id]/archive/route');
  return POST(request(`/api/invoices/${id}/archive`, payload, init), {
    params: Promise.resolve({ id }),
  });
}

async function postClientArchive(
  id = validId,
  payload: unknown = { archived: false },
  init: NextRequestInit = {}
) {
  const { POST } = await import('../app/api/clients/[id]/archive/route');
  return POST(request(`/api/clients/${id}/archive`, payload, init), {
    params: Promise.resolve({ id }),
  });
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
  vi.clearAllMocks();
});

describe('archive API routes', () => {
  it('archives an invoice owned by the authenticated user', async () => {
    const response = await postInvoiceArchive();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: validId,
      archived_at: '2026-05-29T17:55:00.000Z',
    });
    expect(state.updates).toEqual([
      {
        table: 'invoices',
        payload: {
          archived_at: expect.any(String),
          updated_at: expect.any(String),
        },
      },
    ]);
    expect(state.filters).toEqual([
      { table: 'invoices', column: 'id', value: validId },
      { table: 'invoices', column: 'user_id', value: 'user_archive' },
    ]);
  });

  it('restores a client owned by the authenticated user', async () => {
    resetState({ updateResult: { id: validId, archived_at: null } });

    const response = await postClientArchive();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: validId,
      archived_at: null,
    });
    expect(state.updates).toEqual([
      {
        table: 'clients',
        payload: {
          archived_at: null,
          updated_at: expect.any(String),
        },
      },
    ]);
  });

  it('rejects archive requests from another origin', async () => {
    const response = await postInvoiceArchive(validId, { archived: true }, {
      headers: {
        origin: 'https://evil.example',
      },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request origin' });
    expect(state.updates).toHaveLength(0);
  });

  it('requires an authenticated user', async () => {
    resetState({ user: null });

    const response = await postClientArchive();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(state.updates).toHaveLength(0);
  });

  it('rejects invalid ids and invalid archive states before touching data', async () => {
    const invalidIdResponse = await postInvoiceArchive('not-a-uuid', { archived: true });
    const invalidStateResponse = await postInvoiceArchive(validId, { archived: 'yes' });

    expect(invalidIdResponse.status).toBe(400);
    await expect(invalidIdResponse.json()).resolves.toEqual({ error: 'Invalid invoice id.' });
    expect(invalidStateResponse.status).toBe(400);
    await expect(invalidStateResponse.json()).resolves.toEqual({
      error: 'Archive state is required.',
    });
    expect(state.updates).toHaveLength(0);
  });

  it('returns not found when no owned row is updated', async () => {
    resetState({ updateResult: null });

    const response = await postClientArchive();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Client not found.' });
  });
});
