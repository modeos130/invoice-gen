import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { currentMonthStartIso } from '@/lib/billing';
import { buildBillingStatusPayload } from '@/lib/billing-routes';
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
  return NextResponse.json(buildBillingStatusPayload(billingProfile, count ?? 0));
}
