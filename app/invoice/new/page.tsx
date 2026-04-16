'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import type { Client, LineItem } from '@/types/invoice';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const PDFTemplate = dynamic(() => import('@/components/PDFTemplate').then(m => ({ default: m.PDFTemplate })), {
  ssr: false,
});

function generateId(): string {
  return crypto.randomUUID();
}

function emptyLineItem(): LineItem {
  return { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Generate invoice number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const num = (count ?? 0) + 1;
      setInvoiceNumber(`INV-2026-${String(num).padStart(3, '0')}`);

      // Fetch clients
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (clientData) {
        setClients(clientData as Client[]);
      }
    }

    init();
  }, [router]);

  function handleClientSelect(value: string) {
    if (value === '__new__') {
      setSelectedClientId('');
      setShowNewClient(true);
      setClientName('');
      setClientEmail('');
      setClientAddress('');
      return;
    }

    setShowNewClient(false);
    setSelectedClientId(value);
    const client = clients.find((c) => c.id === value);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email || '');
      setClientAddress(client.address || '');
    }
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'description') {
        item.description = value as string;
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0;
      } else if (field === 'rate') {
        item.rate = Number(value) || 0;
      }

      item.amount = item.quantity * item.rate;
      updated[index] = item;
      return updated;
    });
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.amount, 0),
    [lineItems]
  );
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const invoiceData = useMemo(
    () => ({
      id: '',
      user_id: userId,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_email: clientEmail,
      client_address: clientAddress,
      client_id: selectedClientId,
      line_items: lineItems,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      status: 'draft' as const,
      notes,
      invoice_date: invoiceDate,
      due_date: dueDate,
      created_at: new Date().toISOString(),
    }),
    [
      userId, invoiceNumber, clientName, clientEmail, clientAddress,
      selectedClientId, lineItems, subtotal, taxRate, taxAmount, total,
      notes, invoiceDate, dueDate,
    ]
  );

  async function handleSave() {
    if (!clientName.trim()) {
      setError('Client name is required.');
      return;
    }
    if (lineItems.every((item) => !item.description.trim())) {
      setError('Add at least one line item with a description.');
      return;
    }

    setError('');
    setSaving(true);

    let clientId = selectedClientId;

    // If new client, insert first
    if (showNewClient && clientName.trim()) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: clientName.trim(),
          email: clientEmail.trim(),
          address: clientAddress.trim(),
        })
        .select()
        .single();

      if (clientError) {
        setError('Failed to create client: ' + clientError.message);
        setSaving(false);
        return;
      }

      clientId = newClient.id;
    }

    const { error: insertError } = await supabase.from('invoices').insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      client_name: clientName.trim(),
      client_email: clientEmail.trim(),
      client_address: clientAddress.trim(),
      client_id: clientId || null,
      line_items: lineItems,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      status: 'draft',
      notes: notes.trim(),
      invoice_date: invoiceDate,
      due_date: dueDate,
    });

    if (insertError) {
      setError('Failed to save invoice: ' + insertError.message);
      setSaving(false);
      return;
    }

    router.push('/dashboard');
  }

  const inputStyle = {
    backgroundColor: '#0a0f1e',
    border: '1px solid #374151',
    color: '#f9fafb',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0f1e' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: '#9ca3af' }}
            >
              &larr; Dashboard
            </Link>
            <h1 className="text-lg font-bold" style={{ color: '#f9fafb' }}>
              New Invoice
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {typeof window !== 'undefined' && PDFDownloadLink && PDFTemplate && (
              <PDFDownloadLink
                document={<PDFTemplate invoice={invoiceData} />}
                fileName={`${invoiceNumber}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ color: '#f9fafb', border: '1px solid #374151' }}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? 'Preparing...' : 'Download PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg px-6 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
            >
              {saving ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div
            className="mb-6 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form Column */}
          <div className="space-y-6">
            {/* Invoice Details */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
              }}
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                Invoice Details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    readOnly
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ ...inputStyle, opacity: 0.7 }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Client */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
              }}
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                Client
              </h2>
              <div className="mb-4">
                <select
                  value={showNewClient ? '__new__' : selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                  <option value="__new__">+ New Client</option>
                </select>
              </div>

              {(showNewClient || selectedClientId) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={inputStyle}
                      readOnly={!showNewClient}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={inputStyle}
                      readOnly={!showNewClient}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                      Address
                    </label>
                    <textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                      style={inputStyle}
                      readOnly={!showNewClient}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
              }}
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                Line Items
              </h2>
              <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium" style={{ color: '#9ca3af' }}>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-1" />
                </div>

                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <p className="px-3 py-2 text-sm" style={{ color: '#f9fafb' }}>
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                        className="text-sm transition-opacity hover:opacity-80 disabled:opacity-30"
                        style={{ color: '#ef4444' }}
                        aria-label="Remove line item"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addLineItem}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: '#2563eb', border: '1px solid #374151' }}
              >
                + Add Line Item
              </button>

              {/* Totals */}
              <div
                className="mt-6 space-y-2 border-t pt-4"
                style={{ borderColor: '#374151' }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>Subtotal</span>
                  <span style={{ color: '#f9fafb' }}>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#9ca3af' }}>Tax Rate</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                      className="w-16 rounded px-2 py-1 text-sm text-right"
                      style={inputStyle}
                    />
                    <span style={{ color: '#9ca3af' }}>%</span>
                  </div>
                  <span style={{ color: '#f9fafb' }}>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: '#374151' }}>
                  <span style={{ color: '#f9fafb' }}>Total</span>
                  <span style={{ color: '#2563eb' }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
              }}
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Payment terms, thank you message, etc."
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl bg-white p-8 shadow-lg">
              {/* Invoice Preview */}
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  <p className="mt-1 text-sm text-gray-500">{invoiceNumber}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  Draft
                </span>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Bill To
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {clientName || 'Client Name'}
                  </p>
                  {clientEmail && <p className="text-gray-500">{clientEmail}</p>}
                  {clientAddress && (
                    <p className="whitespace-pre-line text-gray-500">{clientAddress}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Invoice Date
                    </p>
                    <p className="text-gray-900">{formatDate(invoiceDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Due Date
                    </p>
                    <p className="text-gray-900">{formatDate(dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="mb-6 w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left text-xs font-semibold uppercase text-gray-400">
                      Description
                    </th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
                      Qty
                    </th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
                      Rate
                    </th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems
                    .filter((item) => item.description.trim())
                    .map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-700">{item.description}</td>
                        <td className="py-2 text-right text-gray-500">{item.quantity}</td>
                        <td className="py-2 text-right text-gray-500">
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="py-2 text-right font-medium text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  {lineItems.every((item) => !item.description.trim()) && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-300 italic">
                        Add line items to see preview
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="ml-auto w-48 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ({taxRate}%)</span>
                    <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {notes && (
                <div className="mt-8 border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">Notes</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
