import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { currentMonthStartIso, FREE_INVOICE_LIMIT, isProEntitled } from '@/lib/billing';
import type { BillingProfile } from '@/lib/billing';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('billing_profiles')
    .select('user_id,stripe_customer_id,stripe_subscription_id,plan,status,current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: 'Billing status unavailable' }, { status: 500 });
  }

  const { count, error: countError } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', currentMonthStartIso());

  if (countError) {
    return NextResponse.json({ error: 'Invoice usage unavailable' }, { status: 500 });
  }

  const billingProfile = (profile as BillingProfile | null) ?? null;
  const isPro = isProEntitled(billingProfile);
  const usedThisMonth = count ?? 0;

  return NextResponse.json({
    plan: billingProfile?.plan ?? 'free',
    status: billingProfile?.status ?? 'free',
    current_period_end: billingProfile?.current_period_end ?? null,
    is_pro: isPro,
    free_invoice_limit: FREE_INVOICE_LIMIT,
    used_this_month: usedThisMonth,
    remaining_this_month: isPro
      ? null
      : Math.max(FREE_INVOICE_LIMIT - usedThisMonth, 0),
  });
}
