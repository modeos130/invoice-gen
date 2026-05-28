import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/server-env';
import { rateLimitRequest, rejectCrossOriginPost } from '@/lib/request-security';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import type { BillingProfile } from '@/lib/billing';

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

  const session = await getStripe().billingPortal.sessions.create({
    customer: billingProfile.stripe_customer_id,
    return_url: `${getBaseUrl(request.nextUrl.origin)}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
