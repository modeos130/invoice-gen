import { describe, expect, it } from 'vitest';
import { GET } from '../app/api/health/route';

describe('health route', () => {
  it('returns a non-secret production health payload', async () => {
    const response = GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload).toEqual({
      ok: true,
      service: 'ihateinvoices',
      timestamp: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
    expect(JSON.stringify(payload)).not.toMatch(/SUPABASE|STRIPE|KEY|SECRET/i);
  });
});
