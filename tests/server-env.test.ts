import { afterEach, describe, expect, it } from 'vitest';
import { getBaseUrl, requireServerEnv } from '../lib/server-env';

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

function setNodeEnv(value: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

afterEach(() => {
  restoreEnv();
});

describe('server env helpers', () => {
  it('requires server env values to exist', () => {
    process.env.TEST_REQUIRED_VALUE = 'present';

    expect(requireServerEnv('TEST_REQUIRED_VALUE')).toBe('present');
  });

  it('throws for missing server env values', () => {
    delete process.env.TEST_REQUIRED_VALUE;

    expect(() => requireServerEnv('TEST_REQUIRED_VALUE')).toThrow(
      'Missing required environment variable: TEST_REQUIRED_VALUE'
    );
  });

  it('normalizes configured app URLs', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.ihateinvoices.com/';

    expect(getBaseUrl()).toBe('https://www.ihateinvoices.com');
  });

  it('allows a request origin fallback outside production', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    setNodeEnv('test');

    expect(getBaseUrl('http://127.0.0.1:3028')).toBe('http://127.0.0.1:3028');
  });

  it('fails closed in production when the configured app URL is missing', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    setNodeEnv('production');

    expect(() => getBaseUrl('https://preview.example')).toThrow(
      'Missing required environment variable: NEXT_PUBLIC_APP_URL'
    );
  });
});
