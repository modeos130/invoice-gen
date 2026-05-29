import type { LineItem } from '@/types/invoice';

export type InvoicePayload = {
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

export type ValidatedInvoicePayload = {
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  lineItems: LineItem[];
  taxRate: number;
  notes: string;
  invoiceDate: string;
  dueDate: string;
};

type ValidationResult =
  | { ok: true; value: ValidatedInvoicePayload }
  | { ok: false; error: string };

export const INVOICE_INPUT_LIMITS = {
  clientName: 140,
  clientEmail: 254,
  clientAddress: 800,
  notes: 1200,
  lineItems: 50,
  lineItemDescription: 240,
  quantity: 100000,
  rate: 1000000,
  lineAmount: 10000000,
} as const;

export function normalizeLineItems(input: InvoicePayload['line_items']): LineItem[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length > INVOICE_INPUT_LIMITS.lineItems) return null;

  const items = input
    .map((item, index) => {
      const description = String(item.description ?? '').trim();
      const quantity = Number(item.quantity ?? 0);
      const rate = Number(item.rate ?? 0);

      if (!description) return null;
      if (description.length > INVOICE_INPUT_LIMITS.lineItemDescription) return null;
      if (!Number.isFinite(quantity) || quantity < 0) return null;
      if (!Number.isFinite(rate) || rate < 0) return null;
      if (quantity > INVOICE_INPUT_LIMITS.quantity || rate > INVOICE_INPUT_LIMITS.rate) return null;

      const amount = quantity * rate;
      if (!Number.isFinite(amount) || amount > INVOICE_INPUT_LIMITS.lineAmount) return null;

      return {
        id: String(item.id ?? index + 1),
        description,
        quantity,
        rate,
        amount,
      };
    })
    .filter((item): item is LineItem => Boolean(item));

  return items.length > 0 ? items : null;
}

export function validateInvoicePayload(payload: unknown): ValidationResult {
  if (!isInvoicePayload(payload)) {
    return { ok: false, error: 'Invalid invoice payload' };
  }

  const lineItems = normalizeLineItems(payload.line_items);

  if (!lineItems) {
    return { ok: false, error: 'Add at least one valid line item.' };
  }

  const taxRate = Number(payload.tax_rate ?? 0);

  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    return { ok: false, error: 'Tax rate must be between 0 and 100.' };
  }

  if (!isDateInput(payload.invoice_date) || !isDateInput(payload.due_date)) {
    return { ok: false, error: 'Invoice date and due date are required.' };
  }

  if (payload.due_date < payload.invoice_date) {
    return { ok: false, error: 'Due date cannot be earlier than invoice date.' };
  }

  const clientId = payload.client_id || null;
  const clientName = String(payload.client_name ?? '').trim();
  const clientEmail = String(payload.client_email ?? '').trim();
  const clientAddress = String(payload.client_address ?? '').trim();
  const notes = String(payload.notes ?? '').trim();

  if (
    isOversized(clientName, INVOICE_INPUT_LIMITS.clientName) ||
    isOversized(clientEmail, INVOICE_INPUT_LIMITS.clientEmail) ||
    isOversized(clientAddress, INVOICE_INPUT_LIMITS.clientAddress) ||
    isOversized(notes, INVOICE_INPUT_LIMITS.notes)
  ) {
    return { ok: false, error: 'Invoice or client details are too long.' };
  }

  if (!clientId && !clientName) {
    return { ok: false, error: 'Client name is required.' };
  }

  return {
    ok: true,
    value: {
      clientId,
      clientName,
      clientEmail,
      clientAddress,
      lineItems,
      taxRate,
      notes,
      invoiceDate: payload.invoice_date,
      dueDate: payload.due_date,
    },
  };
}

function isDateInput(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isInvoicePayload(payload: unknown): payload is InvoicePayload {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}

function isOversized(value: string, maxLength: number): boolean {
  return value.length > maxLength;
}
