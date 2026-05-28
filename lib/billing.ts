export const FREE_INVOICE_LIMIT = 3;

export type BillingProfile = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro';
  status: string;
  current_period_end: string | null;
};

export function isProEntitled(profile: Pick<BillingProfile, 'plan' | 'status'> | null): boolean {
  return profile?.plan === 'pro' && ['active', 'trialing'].includes(profile.status);
}

export function currentMonthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
