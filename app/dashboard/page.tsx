'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { AppPageShell } from '@/components/AppPageShell';
import type { Invoice, InvoiceStatus } from '@/types/invoice';

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: '#eef2f7', text: '#52616f' },
  sent: { label: 'Sent', bg: '#eef8f2', text: '#17613f' },
  paid: { label: 'Paid', bg: '#e8f6ee', text: '#0f7a4f' },
  overdue: { label: 'Overdue', bg: '#fff1f2', text: '#9f1239' },
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
    { label: 'Total Invoiced', value: totalInvoiced },
    { label: 'Paid', value: totalPaid },
    { label: 'Outstanding', value: totalOutstanding },
    { label: 'Overdue', value: totalOverdue },
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
    <AppPageShell
      title="Dashboard"
      subtitle="Track invoices, clients, and billing from one workspace."
      actions={
        <>
          <Link href="/" className="app-btn app-btn-ghost">
            Home
          </Link>
          <Link href="/clients" className="app-btn app-btn-secondary">
            Clients
          </Link>
          <Link href="/invoice/new" className="app-btn app-btn-primary">
            New Invoice
          </Link>
          <button onClick={handleSignOut} className="app-btn app-btn-ghost">
            Sign Out
          </button>
        </>
      }
    >
        {notice && (
          <div
            className={`app-alert mb-6 ${notice.tone === 'success' ? 'app-alert-success' : 'app-alert-warning'}`}
          >
            {notice.message}
          </div>
        )}

        <section className="app-card app-split mb-8">
          <div>
            <p className="app-eyebrow">Billing</p>
            <p className="mt-1 text-lg font-semibold app-strong">
              {billing?.is_pro ? 'Pro plan active' : 'Free plan'}
            </p>
            <p className="mt-1 text-sm app-muted">
              {billing?.is_pro
                ? 'Unlimited invoices are enabled for this account.'
                : billing
                  ? `${billing.used_this_month}/${billing.free_invoice_limit} free invoices used this month.`
                  : 'Checking invoice usage...'}
            </p>
            {billingError && (
              <p className="mt-2 text-sm" style={{ color: '#9f1239' }} role="alert">
                {billingError}
              </p>
            )}
          </div>
          <button
            onClick={() => startBillingSession(billing?.is_pro ? '/api/billing/portal' : '/api/billing/checkout')}
            disabled={billingBusy}
            className={`app-btn ${billing?.is_pro ? 'app-btn-secondary' : 'app-btn-primary'}`}
          >
            {billingBusy ? 'Opening...' : billing?.is_pro ? 'Manage Billing' : 'Upgrade to Pro'}
          </button>
        </section>

        <section className="app-grid-4 mb-8" aria-label="Invoice totals">
          {stats.map((stat) => (
            <div key={stat.label} className="app-stat-card">
              <p className="app-eyebrow">
                {stat.label}
              </p>
              <p className="app-stat-value">
                {formatCurrency(stat.value)}
              </p>
            </div>
          ))}
        </section>

        {loading ? (
          <div className="app-loading" role="status" aria-label="Loading invoices">
            <div className="app-spinner" />
          </div>
        ) : invoices.length === 0 ? (
          <section className="app-card app-empty">
            <div className="app-empty-icon" aria-hidden="true">IH</div>
            <h2>No invoices yet</h2>
            <p className="app-muted">
              Create your first invoice to get started.
            </p>
            <div className="app-check-grid">
              {[
                'Add or select a client',
                'Save an invoice record',
                'Download the saved PDF',
                'Update payment status',
              ].map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
            <Link href="/invoice/new" className="app-btn app-btn-primary">
              Create Invoice
            </Link>
          </section>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  {['Invoice', 'Client', 'Date', 'Due Date', 'Amount', 'Status'].map((h) => (
                    <th
                      key={h}
                      scope="col"
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
                    <tr key={invoice.id}>
                      <td>
                        <Link href={`/invoice/${invoice.id}`} className="hover:underline">
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td>
                        {invoice.client_name}
                      </td>
                      <td>
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td>
                        {formatDate(invoice.due_date)}
                      </td>
                      <td>
                        {formatCurrency(invoice.total)}
                      </td>
                      <td>
                        <span
                          className="app-status"
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
    </AppPageShell>
  );
}
