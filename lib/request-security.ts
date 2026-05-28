import { NextRequest, NextResponse } from 'next/server';

type RateLimitState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitState>();

export function rejectCrossOriginPost(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');

  if (!origin) {
    return null;
  }

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  return null;
}

export function rateLimitRequest(
  key: string,
  options: { limit: number; windowMs: number }
): NextResponse | null {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
  }

  current.count += 1;
  return null;
}
