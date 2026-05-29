'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Archive, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { AppPageShell } from '@/components/AppPageShell';
import type { Invoice, InvoiceStatus } from '@/types/invoice';

const InvoicePdfDownloadButton = dynamic(
  () => import('@/components/InvoicePdfDownloadButton').then((mod) => mod.InvoicePdfDownloadButton),
  {
    ssr: false,
    loading: () => (
      <button type="button" disabled className="app-btn app-btn-secondary">
        Preparing...
      </button>
    ),
  }
);

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: '#eef2f7', text: '#52616f' },
  sent: { label: 'Sent', bg: '#eef8f2', text: '#17613f' },
  paid: { label: 'Paid', bg: '#e8f6ee', text: '#0f7a4f' },
  overdue: { label: 'Overdue', bg: '#fff1f2', text: '#9f1239' },
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
  const [updatingArchive, setUpdatingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState('');

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
      .eq('id', invoice.id)
      .eq('user_id', invoice.user_id);

    if (!error) {
      setInvoice({ ...invoice, status: newStatus });
    }

    setUpdatingStatus(false);
  }

  async function handleArchiveChange(archived: boolean) {
    if (!invoice) return;
    const action = archived ? 'archive' : 'restore';

    if (!window.confirm(`Are you sure you want to ${action} ${invoice.invoice_number}?`)) {
      return;
    }

    setArchiveError('');
    setUpdatingArchive(true);

    const response = await fetch(`/api/invoices/${invoice.id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setArchiveError(result?.error || `Could not ${action} invoice.`);
      setUpdatingArchive(false);
      return;
    }

    setInvoice({ ...invoice, archived_at: result.archived_at ?? null });
    setUpdatingArchive(false);
  }

  if (loading) {
    return (
      <div
        className="app-shell app-loading"
        role="status"
        aria-label="Loading invoice"
      >
        <div className="app-spinner" />
      </div>
    );
  }

  if (!invoice) return null;

  const status = statusConfig[invoice.status];

  return (
    <AppPageShell
      title={invoice.invoice_number}
      subtitle={`Invoice for ${invoice.client_name}`}
      backHref="/dashboard"
      width="md"
      actions={
        <>
            <div className="flex items-center gap-2">
              <label htmlFor="invoice-status" className="app-label">
                Status:
              </label>
              <select
                id="invoice-status"
                value={invoice.status}
                onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
                disabled={updatingStatus}
                className="app-input"
                style={{
                  backgroundColor: status.bg,
                  color: status.text,
                }}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <InvoicePdfDownloadButton invoice={invoice} />

            <button
              type="button"
              onClick={() => handleArchiveChange(!invoice.archived_at)}
              disabled={updatingArchive}
              className="app-btn app-btn-secondary"
            >
              {invoice.archived_at ? (
                <RotateCcw aria-hidden="true" size={16} />
              ) : (
                <Archive aria-hidden="true" size={16} />
              )}
              {updatingArchive ? 'Saving...' : invoice.archived_at ? 'Restore' : 'Archive'}
            </button>
        </>
      }
    >
        {archiveError && (
          <div className="app-alert app-alert-error mb-6" role="alert">
            {archiveError}
          </div>
        )}

        {invoice.archived_at && (
          <div className="app-alert app-alert-warning mb-6" role="status">
            This invoice is archived and hidden from the active dashboard.
          </div>
        )}

        <div className="invoice-paper">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h2>INVOICE</h2>
              <p className="mt-1 text-gray-500">{invoice.invoice_number}</p>
            </div>
            <span
              className="app-status"
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
                <th scope="col" className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Description
                </th>
                <th scope="col" className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Qty
                </th>
                <th scope="col" className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Rate
                </th>
                <th scope="col" className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
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
              <span style={{ color: 'var(--navy)' }}>{formatCurrency(invoice.total)}</span>
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
    </AppPageShell>
  );
}
