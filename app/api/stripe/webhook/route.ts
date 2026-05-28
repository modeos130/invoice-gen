import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { isProEntitled } from '@/lib/billing';
import { requireServerEnv } from '@/lib/server-env';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';

function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

function stripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = createSupabaseAdminClient();
  const customerId = stripeId(subscription.customer);
  let userId = subscription.metadata.user_id || null;

  if (!userId && customerId) {
    const { data } = await admin
      .from('billing_profiles')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }

  if (!userId) {
    throw new Error(`No user_id found for subscription ${subscription.id}`);
  }

  const entitled = isProEntitled({
    plan: 'pro',
    status: subscription.status,
  });

  const { error } = await admin.from('billing_profiles').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan: entitled ? 'pro' : 'free',
    status: subscription.status,
    current_period_end: subscriptionPeriodEnd(subscription),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription' || !session.subscription) return;

  const subscriptionId = stripeId(session.subscription);

  if (!subscriptionId) return;

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription);
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      requireServerEnv('STRIPE_WEBHOOK_SECRET')
    );
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: existingEvent } = await admin
    .from('stripe_webhook_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    await admin.from('stripe_webhook_events').insert({
      id: event.id,
      type: event.type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
