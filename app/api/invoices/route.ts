import { NextRequest, NextResponse } from 'next/server';
import { currentMonthStartIso, FREE_INVOICE_LIMIT, isProEntitled } from '@/lib/billing';
import { rateLimitRequest, rejectCrossOriginPost } from '@/lib/request-security';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { BillingProfile } from '@/lib/billing';
import type { LineItem } from '@/types/invoice';

type InvoicePayload = {
  client_id?: string | null;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  line_items?: Array<Partial<LineItem>>;
  tax_rate?: number;
  notes?: string;
  invoice_date?: string;
  due_date?: string;
};

function normalizeLineItems(input: InvoicePayload['line_items']): LineItem[] | null {
  if (!Array.isArray(input)) return null;

  const items = input
    .map((item, index) => {
      const description = String(item.description ?? '').trim();
      const quantity = Number(item.quantity ?? 0);
      const rate = Number(item.rate ?? 0);

      if (!description) return null;
      if (!Number.isFinite(quantity) || quantity < 0) return null;
      if (!Number.isFinite(rate) || rate < 0) return null;

      return {
        id: String(item.id ?? index + 1),
        description,
        quantity,
        rate,
        amount: quantity * rate,
      };
    })
    .filter((item): item is LineItem => Boolean(item));

  return items.length > 0 ? items : null;
}

function isDateInput(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

  const rateLimitError = rateLimitRequest(`invoice:create:${user.id}`, {
    limit: 12,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  let payload: InvoicePayload;

  try {
    payload = (await request.json()) as InvoicePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid invoice payload' }, { status: 400 });
  }

  const lineItems = normalizeLineItems(payload.line_items);

  if (!lineItems) {
    return NextResponse.json({ error: 'Add at least one valid line item.' }, { status: 400 });
  }

  const taxRate = Number(payload.tax_rate ?? 0);

  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    return NextResponse.json({ error: 'Tax rate must be between 0 and 100.' }, { status: 400 });
  }

  if (!isDateInput(payload.invoice_date) || !isDateInput(payload.due_date)) {
    return NextResponse.json({ error: 'Invoice date and due date are required.' }, { status: 400 });
  }

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

  let clientId = payload.client_id || null;
  let clientName = String(payload.client_name ?? '').trim();
  let clientEmail = String(payload.client_email ?? '').trim();
  let clientAddress = String(payload.client_address ?? '').trim();

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
    if (!clientName) {
      return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
    }

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

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
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
      line_items: lineItems,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      status: 'draft',
      notes: String(payload.notes ?? '').trim(),
      invoice_date: payload.invoice_date,
      due_date: payload.due_date,
    })
    .select('id,invoice_number')
    .single();

  if (insertError || !invoice) {
    return NextResponse.json({ error: 'Failed to save invoice.' }, { status: 500 });
  }

  return NextResponse.json(invoice, { status: 201 });
}
