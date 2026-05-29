import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type AuthCallbackState = {
  exchangeError: Error | null;
  verifyError: Error | null;
  exchangedCode: string | null;
  verifiedOtp: { token_hash: string; type: string } | null;
};

let state: AuthCallbackState;

function resetState(overrides: Partial<AuthCallbackState> = {}) {
  state = {
    exchangeError: null,
    verifyError: null,
    exchangedCode: null,
    verifiedOtp: null,
    ...overrides,
  };
}

function request(path: string) {
  return new NextRequest(`http://localhost:3028${path}`);
}

async function getCallback(path: string) {
  const { GET } = await import('../app/auth/callback/route');
  return GET(request(path));
}

function locationPath(response: Response) {
  const location = response.headers.get('location');
  expect(location).toBeTruthy();
  const url = new URL(location as string);
  return `${url.pathname}${url.search}`;
}

beforeEach(() => {
  vi.resetModules();
  resetState();

  vi.doMock('@/lib/supabase-server', () => ({
    createSupabaseServerClient: async () => ({
      auth: {
        async exchangeCodeForSession(code: string) {
          state.exchangedCode = code;
          return { error: state.exchangeError };
        },
        async verifyOtp(payload: { token_hash: string; type: string }) {
          state.verifiedOtp = payload;
          return { error: state.verifyError };
        },
      },
    }),
  }));
});

describe('auth callback route', () => {
  it('exchanges an auth code and redirects to a safe next path', async () => {
    const response = await getCallback('/auth/callback?code=abc123&next=/dashboard');

    expect(response.status).toBe(307);
    expect(locationPath(response)).toBe('/dashboard');
    expect(state.exchangedCode).toBe('abc123');
    expect(state.verifiedOtp).toBeNull();
  });

  it('falls back to dashboard for unsafe next paths', async () => {
    const response = await getCallback('/auth/callback?code=abc123&next=https://evil.example');

    expect(locationPath(response)).toBe('/dashboard');
    expect(state.exchangedCode).toBe('abc123');
  });

  it('routes reset links with missing codes back to the reset request page', async () => {
    const response = await getCallback('/auth/callback?next=/reset-password');

    expect(locationPath(response)).toBe('/forgot-password?reset_error=missing-code');
    expect(state.exchangedCode).toBeNull();
    expect(state.verifiedOtp).toBeNull();
  });

  it('routes failed reset link exchanges back to the reset request page', async () => {
    resetState({ exchangeError: new Error('invalid code') });

    const response = await getCallback('/auth/callback?code=bad-code&next=/reset-password');

    expect(locationPath(response)).toBe('/forgot-password?reset_error=link-failed');
    expect(state.exchangedCode).toBe('bad-code');
  });

  it('verifies token-hash reset links and redirects to reset-password', async () => {
    const response = await getCallback(
      '/auth/callback?token_hash=token123&type=recovery&next=/reset-password'
    );

    expect(locationPath(response)).toBe('/reset-password');
    expect(state.exchangedCode).toBeNull();
    expect(state.verifiedOtp).toEqual({
      token_hash: 'token123',
      type: 'recovery',
    });
  });
});
