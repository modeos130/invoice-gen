import { NextRequest, NextResponse } from 'next/server';
import { buildBillingPortalSessionParams } from '@/lib/billing-routes';
import { rateLimitRequest, rejectCrossOriginPost } from '@/lib/request-security';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import { isMissingServerEnvError } from '@/lib/server-env';
import type { BillingProfile } from '@/lib/billing';

function describeServerError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: 'UnknownError',
    message: 'Unknown server error',
  };
}

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginPost(request);
  if (originError) return originError;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitError = rateLimitRequest(`billing:portal:${user.id}`, {
    limit: 6,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from('billing_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Billing profile unavailable' }, { status: 500 });
  }

  const billingProfile = profile as Pick<BillingProfile, 'stripe_customer_id'> | null;

  if (!billingProfile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create(
      buildBillingPortalSessionParams(billingProfile.stripe_customer_id, request.nextUrl.origin)
    );

    return NextResponse.json({ url: session.url });
  } catch (sessionError) {
    if (isMissingServerEnvError(sessionError)) {
      console.error('Stripe billing portal is missing required server configuration.');
      return NextResponse.json({ error: 'Payment setup is not configured yet.' }, { status: 503 });
    }

    console.error('Stripe billing portal session creation failed', describeServerError(sessionError));
    return NextResponse.json({ error: 'Billing portal unavailable.' }, { status: 502 });
  }
}
