import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }

  return value;
}

function errorRedirectPath(next: string, reason: 'missing-code' | 'link-failed') {
  if (next === '/reset-password') {
    return `/forgot-password?reset_error=${reason}`;
  }

  return `/login?auth_error=${reason === 'missing-code' ? 'missing-code' : 'confirmation-failed'}`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = safeNextPath(url.searchParams.get('next'));

  if (!code && (!tokenHash || !type)) {
    return NextResponse.redirect(new URL(errorRedirectPath(next, 'missing-code'), request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
      token_hash: tokenHash as string,
      type: type as EmailOtpType,
    });

  if (error) {
    return NextResponse.redirect(new URL(errorRedirectPath(next, 'link-failed'), request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
