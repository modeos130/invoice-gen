import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentMonthStartIso, FREE_INVOICE_LIMIT, isProEntitled } from '../lib/billing';

afterEach(() => {
  vi.useRealTimers();
});

describe('billing helpers', () => {
  it('keeps the free invoice limit explicit', () => {
    expect(FREE_INVOICE_LIMIT).toBe(3);
  });

  it('only treats active or trialing pro profiles as entitled', () => {
    expect(isProEntitled(null)).toBe(false);
    expect(isProEntitled({ plan: 'free', status: 'active' })).toBe(false);
    expect(isProEntitled({ plan: 'pro', status: 'canceled' })).toBe(false);
    expect(isProEntitled({ plan: 'pro', status: 'active' })).toBe(true);
    expect(isProEntitled({ plan: 'pro', status: 'trialing' })).toBe(true);
  });

  it('returns the UTC start of the current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T18:45:12.000Z'));

    expect(currentMonthStartIso()).toBe('2026-05-01T00:00:00.000Z');
  });
});
