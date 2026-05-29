import type Stripe from 'stripe';
import { isProEntitled } from './billing';

type QueryResult<T> = PromiseLike<{ data: T | null; error?: unknown }>;

type MaybeSingleQuery<T> = {
  maybeSingle(): QueryResult<T>;
};

type FilterQuery<T> = {
  eq(column: string, value: string): MaybeSingleQuery<T>;
};

type SelectQuery<T> = {
  select(columns: string): FilterQuery<T>;
};

type TableClient<T = unknown> = SelectQuery<T> & {
  upsert?(payload: Record<string, unknown>): Promise<{ error?: unknown }>;
  insert?(payload: Record<string, unknown>): Promise<{ error?: unknown }>;
};

export type StripeWebhookAdminClient = {
  from(table: string): TableClient;
};

export type StripeWebhookProcessor = {
  subscriptions: {
    retrieve(id: string): Promise<Stripe.Subscription>;
  };
};

export type StripeWebhookResult = {
  received: true;
  duplicate?: true;
};

type SyncSubscriptionOptions = {
  now?: () => Date;
};

export function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

export function stripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

export async function syncSubscription(
  subscription: Stripe.Subscription,
  admin: StripeWebhookAdminClient,
  options: SyncSubscriptionOptions = {}
) {
  const customerId = stripeId(subscription.customer);
  let userId = subscription.metadata.user_id || null;

  if (!userId && customerId) {
    const { data } = await admin
      .from('billing_profiles')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    userId = (data as { user_id?: string } | null)?.user_id ?? null;
  }

  if (!userId) {
    throw new Error(`No user_id found for subscription ${subscription.id}`);
  }

  const entitled = isProEntitled({
    plan: 'pro',
    status: subscription.status,
  });

  const billingProfiles = admin.from('billing_profiles');

  if (!billingProfiles.upsert) {
    throw new Error('Billing profile upsert is unavailable');
  }

  const { error } = await billingProfiles.upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan: entitled ? 'pro' : 'free',
    status: subscription.status,
    current_period_end: subscriptionPeriodEnd(subscription),
    updated_at: (options.now ?? (() => new Date()))().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function syncCheckoutSession(
  session: Stripe.Checkout.Session,
  admin: StripeWebhookAdminClient,
  stripe: StripeWebhookProcessor,
  options: SyncSubscriptionOptions = {}
) {
  if (session.mode !== 'subscription' || !session.subscription) return;

  const subscriptionId = stripeId(session.subscription);

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription, admin, options);
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
  admin: StripeWebhookAdminClient,
  stripe: StripeWebhookProcessor,
  options: SyncSubscriptionOptions = {}
): Promise<StripeWebhookResult> {
  const { data: existingEvent } = await admin
    .from('stripe_webhook_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existingEvent) {
    return { received: true, duplicate: true };
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await syncCheckoutSession(event.data.object as Stripe.Checkout.Session, admin, stripe, options);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object as Stripe.Subscription, admin, options);
      break;
    default:
      break;
  }

  const webhookEvents = admin.from('stripe_webhook_events');

  if (!webhookEvents.insert) {
    throw new Error('Webhook event insert is unavailable');
  }

  const { error } = await webhookEvents.insert({
    id: event.id,
    type: event.type,
  });

  if (error) {
    throw error;
  }

  return { received: true };
}
