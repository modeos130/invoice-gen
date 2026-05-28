'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import type { Invoice, InvoiceStatus } from '@/types/invoice';

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' },
  sent: { label: 'Sent', bg: 'rgba(37, 99, 235, 0.2)', text: '#60a5fa' },
  paid: { label: 'Paid', bg: 'rgba(34, 197, 94, 0.2)', text: '#86efac' },
  overdue: { label: 'Overdue', bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' },
};

type BillingStatus = {
  plan: 'free' | 'pro';
  status: string;
  is_pro: boolean;
  free_invoice_limit: number;
  used_this_month: number;
  remaining_this_month: number | null;
};

type Notice = {
  tone: 'success' | 'warning';
  message: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);

    if (params.get('created') === 'true') {
      return { tone: 'success', message: 'Invoice saved.' };
    }

    if (params.get('checkout') === 'success') {
      return {
        tone: 'success',
        message: 'Checkout complete. Your billing status will update after Stripe confirms payment.',
      };
    }

    if (params.get('checkout') === 'cancelled') {
      return { tone: 'warning', message: 'Checkout cancelled. Your plan was not changed.' };
    }

    return null;
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState('');

  useEffect(() => {
    if (!notice) return;
    window.history.replaceState({}, '', '/dashboard');
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    async function fetchInvoices() {
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvoices(data as Invoice[]);
      }

      setLoading(false);
    }

    fetchInvoices();
  }, [router]);

  useEffect(() => {
    async function fetchBilling() {
      const response = await fetch('/api/billing/status');

      if (response.status === 401) return;

      if (!response.ok) {
        setBillingError('Billing status unavailable.');
        return;
      }

      setBilling((await response.json()) as BillingStatus);
    }

    fetchBilling();
  }, []);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalOverdue = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const stats = [
    { label: 'Total Invoiced', value: totalInvoiced, color: '#f9fafb' },
    { label: 'Paid', value: totalPaid, color: '#86efac' },
    { label: 'Outstanding', value: totalOutstanding, color: '#60a5fa' },
    { label: 'Overdue', value: totalOverdue, color: '#fca5a5' },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function startBillingSession(endpoint: '/api/billing/checkout' | '/api/billing/portal') {
    setBillingError('');
    setBillingBusy(true);

    const response = await fetch(endpoint, { method: 'POST' });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.url) {
      setBillingError(result?.error || 'Billing session unavailable.');
      setBillingBusy(false);
      return;
    }

    window.location.href = result.url;
  }

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
          <h1 className="text-xl font-bold" style={{ color: '#2563eb' }}>
            I Hate Invoices
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: '#f9fafb', border: '1px solid #374151' }}
            >
              Clients
            </Link>
            <Link
              href="/invoice/new"
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
            >
              + New Invoice
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: '#9ca3af' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {notice && (
          <div
            className="mb-6 rounded-lg px-4 py-3 text-sm font-medium"
            style={{
              backgroundColor: notice.tone === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: notice.tone === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
              color: notice.tone === 'success' ? '#86efac' : '#fbbf24',
            }}
          >
            {notice.message}
          </div>
        )}

        <div
          className="mb-8 flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ backgroundColor: '#111827', border: '1px solid #374151' }}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9ca3af' }}>
              Billing
            </p>
            <p className="mt-1 text-lg font-semibold" style={{ color: '#f9fafb' }}>
              {billing?.is_pro ? 'Pro plan active' : 'Free plan'}
            </p>
            <p className="mt-1 text-sm" style={{ color: '#9ca3af' }}>
              {billing?.is_pro
                ? 'Unlimited invoices are enabled for this account.'
                : billing
                  ? `${billing.used_this_month}/${billing.free_invoice_limit} free invoices used this month.`
                  : 'Checking invoice usage...'}
            </p>
            {billingError && (
              <p className="mt-2 text-sm" style={{ color: '#fca5a5' }} role="alert">
                {billingError}
              </p>
            )}
          </div>
          <button
            onClick={() => startBillingSession(billing?.is_pro ? '/api/billing/portal' : '/api/billing/checkout')}
            disabled={billingBusy}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: billing?.is_pro ? 'transparent' : '#2563eb',
              border: billing?.is_pro ? '1px solid #374151' : '1px solid #2563eb',
              color: '#f9fafb',
            }}
          >
            {billingBusy ? 'Opening...' : billing?.is_pro ? 'Manage Billing' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-5"
              style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold" style={{ color: stat.color }}>
                {formatCurrency(stat.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Invoice List */}
        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-label="Loading invoices">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
            />
          </div>
        ) : invoices.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
            }}
          >
            <svg
              className="mb-4 h-16 w-16"
              fill="none"
              stroke="#374151"
              strokeWidth={1}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mb-1 text-lg font-medium" style={{ color: '#f9fafb' }}>
              No invoices yet
            </p>
            <p className="mb-6 text-sm" style={{ color: '#9ca3af' }}>
              Create your first invoice to get started.
            </p>
            <div className="mb-6 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
              {[
                'Add or select a client',
                'Save an invoice record',
                'Download the saved PDF',
                'Update payment status',
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ border: '1px solid #374151', color: '#d1d5db' }}
                >
                  {step}
                </div>
              ))}
            </div>
            <Link
              href="/invoice/new"
              className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
            >
              Create Invoice
            </Link>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
            }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  {['Invoice', 'Client', 'Date', 'Due Date', 'Amount', 'Status'].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#9ca3af' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.status];
                  return (
                    <tr
                      key={invoice.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #374151' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#f9fafb' }}>
                        <Link href={`/invoice/${invoice.id}`} className="hover:underline">
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#d1d5db' }}>
                        {invoice.client_name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#9ca3af' }}>
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#9ca3af' }}>
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#f9fafb' }}>
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: status.bg,
                            color: status.text,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
