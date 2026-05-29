import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  rateLimitRequest,
  rejectCrossOriginPost,
  resetRateLimitBucketsForTest,
} from '../lib/request-security';

function requestWithOrigin(origin: string | null, requestOrigin = 'https://www.ihateinvoices.com') {
  return {
    headers: {
      get(name: string) {
        return name.toLowerCase() === 'origin' ? origin : null;
      },
    },
    nextUrl: {
      origin: requestOrigin,
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  resetRateLimitBucketsForTest();
});

describe('request security helpers', () => {
  it('allows requests without an origin header', () => {
    expect(rejectCrossOriginPost(requestWithOrigin(null) as never)).toBeNull();
  });

  it('allows same-origin requests', () => {
    expect(
      rejectCrossOriginPost(
        requestWithOrigin('https://www.ihateinvoices.com', 'https://www.ihateinvoices.com') as never
      )
    ).toBeNull();
  });

  it('rejects cross-origin requests', () => {
    const response = rejectCrossOriginPost(
      requestWithOrigin('https://invalid.example', 'https://www.ihateinvoices.com') as never
    );

    expect(response?.status).toBe(403);
  });

  it('rate-limits after the configured limit', () => {
    expect(rateLimitRequest('test-key', { limit: 2, windowMs: 1000 })).toBeNull();
    expect(rateLimitRequest('test-key', { limit: 2, windowMs: 1000 })).toBeNull();

    const response = rateLimitRequest('test-key', { limit: 2, windowMs: 1000 });

    expect(response?.status).toBe(429);
  });

  it('resets rate limits after the window expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T00:00:00.000Z'));

    expect(rateLimitRequest('window-key', { limit: 1, windowMs: 1000 })).toBeNull();
    expect(rateLimitRequest('window-key', { limit: 1, windowMs: 1000 })?.status).toBe(429);

    vi.setSystemTime(new Date('2026-05-29T00:00:01.001Z'));

    expect(rateLimitRequest('window-key', { limit: 1, windowMs: 1000 })).toBeNull();
  });
});
