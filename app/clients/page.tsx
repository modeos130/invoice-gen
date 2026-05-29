'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppPageShell } from '@/components/AppPageShell';
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

  return (
    <AppPageShell
      title="Clients"
      subtitle="Keep client details ready before creating invoices."
      backHref="/dashboard"
      actions={
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className={`app-btn ${showForm ? 'app-btn-secondary' : 'app-btn-primary'}`}
        >
          {showForm ? 'Cancel' : 'Add Client'}
        </button>
      }
      width="lg"
    >
        {showForm && (
          <section className="app-card mb-8">
            <h2 className="mb-4">New Client</h2>

            {error && (
              <div
                role="alert"
                className="app-alert app-alert-error mb-4"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="app-field-grid app-field-grid-2">
                <div className="app-field">
                  <label
                    htmlFor="client-name"
                    className="app-label"
                  >
                    Name *
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    maxLength={140}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="app-input"
                    placeholder="Client name"
                  />
                </div>
                <div className="app-field">
                  <label
                    htmlFor="client-email"
                    className="app-label"
                  >
                    Email
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="app-input"
                    placeholder="client@example.com"
                  />
                </div>
                <div className="app-field">
                  <label
                    htmlFor="client-phone"
                    className="app-label"
                  >
                    Phone
                  </label>
                  <input
                    id="client-phone"
                    type="tel"
                    maxLength={40}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="app-input"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="app-field">
                  <label
                    htmlFor="client-address"
                    className="app-label"
                  >
                    Address
                  </label>
                  <input
                    id="client-address"
                    type="text"
                    maxLength={800}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="app-input"
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="app-btn app-btn-primary"
                >
                  {saving ? 'Saving...' : 'Add Client'}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="app-loading" role="status" aria-label="Loading clients">
            <div className="app-spinner" />
          </div>
        ) : clients.length === 0 ? (
          <section className="app-card app-empty">
            <div className="app-empty-icon" aria-hidden="true">CL</div>
            <h2>No clients yet</h2>
            <p className="app-muted">
              Add your first client to get started.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="app-btn app-btn-primary"
            >
              Add Client
            </button>
          </section>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  {['Name', 'Email', 'Phone', 'Invoices'].map((h) => (
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
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      {client.name}
                    </td>
                    <td>
                      {client.email || '\u2014'}
                    </td>
                    <td>
                      {client.phone || '\u2014'}
                    </td>
                    <td>
                      {client.invoice_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </AppPageShell>
  );
}
