export function requireServerEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function isMissingServerEnvError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('Missing required environment variable:');
}

export function getBaseUrl(origin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return validateBaseUrl(configured);
  }

  if (process.env.NODE_ENV !== 'production') {
    return validateBaseUrl(origin || 'http://localhost:3000');
  }

  throw new Error('Missing required environment variable: NEXT_PUBLIC_APP_URL');
}

function validateBaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_APP_URL must be a valid absolute URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('NEXT_PUBLIC_APP_URL must use http or https');
  }

  return url.toString().replace(/\/$/, '');
}
