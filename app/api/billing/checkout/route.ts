import { NextRequest, NextResponse } from 'next/server';
import {
  buildBillingPortalSessionParams,
  buildProCheckoutSessionParams,
} from '@/lib/billing-routes';
import type Stripe from 'stripe';
import { rateLimitRequest, rejectCrossOriginPost } from '@/lib/request-security';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { getProPriceId, getStripe } from '@/lib/stripe';
import { isMissingServerEnvError } from '@/lib/server-env';
import { isProEntitled } from '@/lib/billing';
import type { BillingProfile } from '@/lib/billing';
import type { User } from '@supabase/supabase-js';

function isMissingStripeCustomerError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const maybeStripeError = error as {
    code?: unknown;
    param?: unknown;
    message?: unknown;
    type?: unknown;
  };

  return (
    maybeStripeError.type === 'StripeInvalidRequestError' &&
    maybeStripeError.code === 'resource_missing' &&
    (maybeStripeError.param === 'customer' ||
      (typeof maybeStripeError.message === 'string' &&
        maybeStripeError.message.toLowerCase().includes('no such customer')))
  );
}

async function createStripeCustomerForUser(
  stripe: Stripe,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  user: User
) {
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
    },
  });

  const { error: upsertError } = await admin.from('billing_profiles').upsert({
    user_id: user.id,
    stripe_customer_id: customer.id,
    plan: 'free',
    status: 'free',
  });

  if (upsertError) {
    throw new Error('Failed to prepare billing profile');
  }

  return customer.id;
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
  try {
    const stripe = getStripe();
    let customerId = billingProfile?.stripe_customer_id ?? null;

    if (isProEntitled(billingProfile) && customerId) {
      const portal = await stripe.billingPortal.sessions.create(
        buildBillingPortalSessionParams(customerId, request.nextUrl.origin)
      );

      return NextResponse.json({ url: portal.url });
    }

    if (!customerId) {
      customerId = await createStripeCustomerForUser(stripe, admin, user);
    }

    const checkoutParams = {
      userId: user.id,
      priceId: getProPriceId(),
      origin: request.nextUrl.origin,
    };
    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create(
        buildProCheckoutSessionParams({
          ...checkoutParams,
          customerId,
        })
      );
    } catch (checkoutError) {
      if (!isMissingStripeCustomerError(checkoutError)) {
        throw checkoutError;
      }

      customerId = await createStripeCustomerForUser(stripe, admin, user);
      session = await stripe.checkout.sessions.create(
        buildProCheckoutSessionParams({
          ...checkoutParams,
          customerId,
        })
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (isMissingServerEnvError(error)) {
      console.error('Stripe checkout is missing required server configuration.');
      return NextResponse.json({ error: 'Payment setup is not configured yet.' }, { status: 503 });
    }

    if (error instanceof Error && error.message === 'Failed to prepare billing profile') {
      return NextResponse.json({ error: 'Failed to prepare billing profile' }, { status: 500 });
    }

    console.error('Stripe checkout session creation failed.');
    return NextResponse.json({ error: 'Billing session unavailable.' }, { status: 502 });
  }
}
