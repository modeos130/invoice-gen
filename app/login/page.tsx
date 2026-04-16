'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0a0f1e' }}
    >
      <div
        className="w-full max-w-md rounded-xl p-8 shadow-2xl"
        style={{ backgroundColor: '#111827', border: '1px solid #374151' }}
      >
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#2563eb' }}
          >
            Invoice-gen
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#9ca3af' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#f9fafb' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
              style={{
                backgroundColor: '#0a0f1e',
                border: '1px solid #374151',
                color: '#f9fafb',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#f9fafb' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
              style={{
                backgroundColor: '#0a0f1e',
                border: '1px solid #374151',
                color: '#f9fafb',
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: '#9ca3af' }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium hover:underline"
            style={{ color: '#2563eb' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
