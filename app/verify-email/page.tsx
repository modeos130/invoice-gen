'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function resend() {
    if (!email) return;
    await supabase.auth.resend({ type: 'signup', email });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0f1e' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl text-center" style={{ background: '#111827', border: '1px solid #374151' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#f9fafb' }}>Verify your email</h2>
        <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
          Please check your inbox and click the verification link before continuing.
        </p>
        <input
          type="email" placeholder="Enter your email to resend" value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none mb-3"
          style={{ background: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }}
        />
        <button onClick={resend} className="w-full py-2.5 rounded-lg font-semibold text-sm"
          style={{ background: sent ? '#10b981' : '#2563eb', color: 'white' }}>
          {sent ? 'Sent!' : 'Resend verification email'}
        </button>
        <Link href="/login" className="block mt-4 text-sm" style={{ color: '#6b7280' }}>
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
