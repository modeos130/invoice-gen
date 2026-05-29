import { NextRequest, NextResponse } from 'next/server';
import {
  buildBillingPortalSessionParams,
  buildProCheckoutSessionParams,
} from '@/lib/billing-routes';
import { rateLimitRequest, rejectCrossOriginPost } from '@/lib/request-security';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { getProPriceId, getStripe } from '@/lib/stripe';
import { isProEntitled } from '@/lib/billing';
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

  const rateLimitError = rateLimitRequest(`billing:checkout:${user.id}`, {
    limit: 6,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('billing_profiles')
    .select('user_id,stripe_customer_id,stripe_subscription_id,plan,status,current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: 'Billing profile unavailable' }, { status: 500 });
  }

  const billingProfile = (profile as BillingProfile | null) ?? null;
  const stripe = getStripe();
  let customerId = billingProfile?.stripe_customer_id ?? null;

  if (isProEntitled(billingProfile) && customerId) {
    const portal = await stripe.billingPortal.sessions.create(
      buildBillingPortalSessionParams(customerId, request.nextUrl.origin)
    );

    return NextResponse.json({ url: portal.url });
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
      },
    });
    customerId = customer.id;

    const { error: upsertError } = await admin.from('billing_profiles').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan: 'free',
      status: 'free',
    });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to prepare billing profile' }, { status: 500 });
    }
  }

  const session = await stripe.checkout.sessions.create(
    buildProCheckoutSessionParams({
      customerId,
      userId: user.id,
      priceId: getProPriceId(),
      origin: request.nextUrl.origin,
    })
  );

  return NextResponse.json({ url: session.url });
}
