import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { requireServerEnv } from '@/lib/server-env';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getProPriceId, getStripe } from '@/lib/stripe';
import { processStripeWebhookEvent, type StripeWebhookAdminClient } from '@/lib/stripe-webhook';

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
  const payload = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      requireServerEnv('STRIPE_WEBHOOK_SECRET')
    );
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    const result = await processStripeWebhookEvent(
      event,
      admin as unknown as StripeWebhookAdminClient,
      stripe,
      { expectedPriceId: getProPriceId() }
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    console.error('Stripe webhook processing failed', {
      eventId: event.id,
      eventType: event.type,
      ...describeServerError(error),
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
