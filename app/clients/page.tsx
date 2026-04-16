'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/types/invoice';

interface ClientWithCount extends Client {
  invoice_count: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  async function fetchClients() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch clients
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (!clientData) {
      setLoading(false);
      return;
    }

    // Fetch invoice counts per client
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('client_id')
      .eq('user_id', user.id);

    const countMap: Record<string, number> = {};
    if (invoiceData) {
      for (const inv of invoiceData) {
        if (inv.client_id) {
          countMap[inv.client_id] = (countMap[inv.client_id] || 0) + 1;
        }
      }
    }

    const enriched: ClientWithCount[] = (clientData as Client[]).map((c) => ({
      ...c,
      invoice_count: countMap[c.id] || 0,
    }));

    setClients(enriched);
    setLoading(false);
  }

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Client name is required.');
      return;
    }

    setError('');
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error: insertError } = await supabase.from('clients').insert({
      user_id: user.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    if (insertError) {
      setError('Failed to add client: ' + insertError.message);
      setSaving(false);
      return;
    }

    resetForm();
    setShowForm(false);
    setSaving(false);
    setLoading(true);
    fetchClients();
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: '#9ca3af' }}
            >
              &larr; Dashboard
            </Link>
            <h1 className="text-lg font-bold" style={{ color: '#f9fafb' }}>
              Clients
            </h1>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
          >
            {showForm ? 'Cancel' : '+ Add Client'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Add Client Form */}
        {showForm && (
          <div
            className="mb-8 rounded-xl p-6"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
            }}
          >
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-wider"
              style={{ color: '#9ca3af' }}
            >
              New Client
            </h2>

            {error && (
              <div
                className="mb-4 rounded-lg px-4 py-3 text-sm"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#9ca3af' }}
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg px-6 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
                >
                  {saving ? 'Saving...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Client List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
            />
          </div>
        ) : clients.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mb-1 text-lg font-medium" style={{ color: '#f9fafb' }}>
              No clients yet
            </p>
            <p className="mb-6 text-sm" style={{ color: '#9ca3af' }}>
              Add your first client to get started.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
            >
              Add Client
            </button>
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
                  {['Name', 'Email', 'Phone', 'Invoices'].map((h) => (
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
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    style={{ borderBottom: '1px solid #374151' }}
                  >
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#f9fafb' }}>
                      {client.name}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#d1d5db' }}>
                      {client.email || '\u2014'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#d1d5db' }}>
                      {client.phone || '\u2014'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#9ca3af' }}>
                      {client.invoice_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
