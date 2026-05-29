import { describe, expect, it } from 'vitest';
import { INVOICE_INPUT_LIMITS, validateInvoicePayload } from '../lib/invoice-validation';

const validPayload = {
  client_name: 'Acme Studio',
  client_email: 'billing@example.com',
  client_address: '123 Main St',
  line_items: [{ description: 'Mix revision', quantity: 2, rate: 150 }],
  tax_rate: 5,
  notes: 'Thank you.',
  invoice_date: '2026-05-29',
  due_date: '2026-06-28',
};

describe('invoice validation', () => {
  it('rejects non-object payloads', () => {
    expect(validateInvoicePayload(null)).toEqual({ ok: false, error: 'Invalid invoice payload' });
    expect(validateInvoicePayload([])).toEqual({ ok: false, error: 'Invalid invoice payload' });
  });

  it('normalizes a valid payload', () => {
    const result = validateInvoicePayload(validPayload);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.clientName).toBe('Acme Studio');
    expect(result.value.lineItems[0]).toMatchObject({
      description: 'Mix revision',
      quantity: 2,
      rate: 150,
      amount: 300,
    });
    expect(result.value.taxRate).toBe(5);
  });

  it('requires at least one valid line item', () => {
    const result = validateInvoicePayload({ ...validPayload, line_items: [] });

    expect(result).toEqual({ ok: false, error: 'Add at least one valid line item.' });
  });

  it('rejects oversized client and invoice details', () => {
    const result = validateInvoicePayload({
      ...validPayload,
      notes: 'x'.repeat(INVOICE_INPUT_LIMITS.notes + 1),
    });

    expect(result).toEqual({ ok: false, error: 'Invoice or client details are too long.' });
  });

  it('rejects line item abuse', () => {
    const result = validateInvoicePayload({
      ...validPayload,
      line_items: [{ description: 'Too much', quantity: INVOICE_INPUT_LIMITS.quantity + 1, rate: 1 }],
    });

    expect(result).toEqual({ ok: false, error: 'Add at least one valid line item.' });
  });

  it('rejects invalid tax rates', () => {
    const result = validateInvoicePayload({ ...validPayload, tax_rate: 101 });

    expect(result).toEqual({ ok: false, error: 'Tax rate must be between 0 and 100.' });
  });

  it('rejects missing dates', () => {
    const result = validateInvoicePayload({ ...validPayload, invoice_date: undefined });

    expect(result).toEqual({ ok: false, error: 'Invoice date and due date are required.' });
  });

  it('rejects due dates before invoice dates', () => {
    const result = validateInvoicePayload({ ...validPayload, due_date: '2026-05-28' });

    expect(result).toEqual({ ok: false, error: 'Due date cannot be earlier than invoice date.' });
  });

  it('requires a client name when no existing client is selected', () => {
    const result = validateInvoicePayload({ ...validPayload, client_name: '   ' });

    expect(result).toEqual({ ok: false, error: 'Client name is required.' });
  });

  it('allows an existing client id without a new client name', () => {
    const result = validateInvoicePayload({
      ...validPayload,
      client_id: 'client-123',
      client_name: '   ',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.clientId).toBe('client-123');
  });
});
