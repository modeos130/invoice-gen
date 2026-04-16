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

export default function DashboardPage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("created=true")) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

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
          <div className="flex items-center justify-center py-20">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
            />
          </div>
        ) : invoices.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl py-20"
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
                      onClick={() => router.push(`/invoice/${invoice.id}`)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid #374151' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#f9fafb' }}>
                        {invoice.invoice_number}
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
