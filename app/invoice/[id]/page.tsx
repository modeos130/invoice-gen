'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import type { Invoice, InvoiceStatus } from '@/types/invoice';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const PDFTemplate = dynamic(() => import('@/components/PDFTemplate').then(m => ({ default: m.PDFTemplate })), {
  ssr: false,
});

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' },
  sent: { label: 'Sent', bg: 'rgba(37, 99, 235, 0.2)', text: '#60a5fa' },
  paid: { label: 'Paid', bg: 'rgba(34, 197, 94, 0.2)', text: '#86efac' },
  overdue: { label: 'Overdue', bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        router.push('/dashboard');
        return;
      }

      setInvoice(data as Invoice);
      setLoading(false);
    }

    fetchInvoice();
  }, [id, router]);

  async function handleStatusChange(newStatus: InvoiceStatus) {
    if (!invoice) return;
    setUpdatingStatus(true);

    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoice.id);

    if (!error) {
      setInvoice({ ...invoice, status: newStatus });
    }

    setUpdatingStatus(false);
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0a0f1e' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!invoice) return null;

  const status = statusConfig[invoice.status];

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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: '#9ca3af' }}
            >
              &larr; Dashboard
            </Link>
            <h1 className="text-lg font-bold" style={{ color: '#f9fafb' }}>
              {invoice.invoice_number}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                Status:
              </label>
              <select
                value={invoice.status}
                onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
                disabled={updatingStatus}
                className="rounded-lg px-3 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: status.bg,
                  color: status.text,
                  border: '1px solid #374151',
                }}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {typeof window !== 'undefined' && PDFDownloadLink && PDFTemplate && (
              <PDFDownloadLink
                document={<PDFTemplate invoice={invoice} />}
                fileName={`${invoice.invoice_number}.pdf`}
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
          </div>
        </div>
      </header>

      {/* Invoice Preview */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-xl bg-white p-10 shadow-lg">
          {/* Header */}
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
              <p className="mt-1 text-gray-500">{invoice.invoice_number}</p>
            </div>
            <span
              className="rounded-full px-4 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: status.bg,
                color: status.text,
              }}
            >
              {status.label}
            </span>
          </div>

          {/* Client and Dates */}
          <div className="mb-10 grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Bill To
              </p>
              <p className="mt-2 text-lg font-medium text-gray-900">
                {invoice.client_name}
              </p>
              {invoice.client_email && (
                <p className="text-gray-500">{invoice.client_email}</p>
              )}
              {invoice.client_address && (
                <p className="mt-1 whitespace-pre-line text-gray-500">
                  {invoice.client_address}
                </p>
              )}
            </div>
            <div className="text-right space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Invoice Date
                </p>
                <p className="mt-1 text-gray-900">{formatDate(invoice.invoice_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Due Date
                </p>
                <p className="mt-1 text-gray-900">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <table className="mb-8 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Description
                </th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Qty
                </th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Rate
                </th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-700">{item.description}</td>
                  <td className="py-3 text-right text-gray-500">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-500">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                <span className="text-gray-900">
                  {formatCurrency(invoice.tax_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-gray-200 pt-3 text-lg font-bold">
              <span className="text-gray-900">Total</span>
              <span style={{ color: '#2563eb' }}>{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-10 border-t border-gray-200 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
