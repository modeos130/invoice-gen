import { NextRequest, NextResponse } from 'next/server';
import { currentMonthStartIso, FREE_INVOICE_LIMIT, isProEntitled } from '@/lib/billing';
import { validateInvoicePayload } from '@/lib/invoice-validation';
import { rateLimitRequest, rejectCrossOriginPost } from '@/lib/request-security';
import { createSupabaseServerClient } from '@/lib/supabase-server';
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

  const rateLimitError = rateLimitRequest(`invoice:create:${user.id}`, {
    limit: 12,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid invoice payload' }, { status: 400 });
  }

  const validation = validateInvoicePayload(payload);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const validatedPayload = validation.value;

  const { data: profile, error: profileError } = await supabase
    .from('billing_profiles')
    .select('plan,status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: 'Billing status unavailable.' }, { status: 500 });
  }

  const isPro = isProEntitled((profile as BillingProfile | null) ?? null);

  if (!isPro) {
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', currentMonthStartIso());

    if (countError) {
      return NextResponse.json({ error: 'Invoice usage unavailable.' }, { status: 500 });
    }

    if ((count ?? 0) >= FREE_INVOICE_LIMIT) {
      return NextResponse.json(
        {
          error: `Free plan limit reached. Upgrade to Pro for unlimited invoices.`,
          code: 'FREE_LIMIT_REACHED',
        },
        { status: 402 }
      );
    }
  }

  let clientId = validatedPayload.clientId;
  let clientName = validatedPayload.clientName;
  let clientEmail = validatedPayload.clientEmail;
  let clientAddress = validatedPayload.clientAddress;

  if (clientId) {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id,name,email,address')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Selected client was not found.' }, { status: 400 });
    }

    clientName = client.name;
    clientEmail = client.email ?? '';
    clientAddress = client.address ?? '';
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: clientName,
        email: clientEmail,
        address: clientAddress,
      })
      .select('id')
      .single();

    if (clientError || !newClient) {
      return NextResponse.json({ error: 'Failed to create client.' }, { status: 500 });
    }

    clientId = newClient.id;
  }

  const subtotal = validatedPayload.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (validatedPayload.taxRate / 100);
  const total = subtotal + taxAmount;

  const { count: invoiceCount, error: invoiceCountError } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (invoiceCountError) {
    return NextResponse.json({ error: 'Unable to generate invoice number.' }, { status: 500 });
  }

  const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${String((invoiceCount ?? 0) + 1).padStart(3, '0')}`;

  const { data: invoice, error: insertError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_email: clientEmail,
      client_address: clientAddress,
      client_id: clientId,
      line_items: validatedPayload.lineItems,
      subtotal,
      tax_rate: validatedPayload.taxRate,
      tax_amount: taxAmount,
      total,
      status: 'draft',
      notes: validatedPayload.notes,
      invoice_date: validatedPayload.invoiceDate,
      due_date: validatedPayload.dueDate,
    })
    .select('id,invoice_number')
    .single();

  if (insertError || !invoice) {
    return NextResponse.json({ error: 'Failed to save invoice.' }, { status: 500 });
  }

  return NextResponse.json(invoice, { status: 201 });
}
