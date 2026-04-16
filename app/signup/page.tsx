'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
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
            Create your account
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div
              className="rounded-lg px-4 py-6"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <svg
                className="mx-auto mb-3 h-10 w-10"
                fill="none"
                stroke="#22c55e"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium" style={{ color: '#86efac' }}>
                Check your email to confirm your account.
              </p>
              <p className="mt-1 text-xs" style={{ color: '#9ca3af' }}>
                We sent a confirmation link to <strong style={{ color: '#f9fafb' }}>{email}</strong>
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block text-sm font-medium hover:underline"
              style={{ color: '#2563eb' }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
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
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#f9fafb' }}
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                  style={{
                    backgroundColor: '#0a0f1e',
                    border: '1px solid #374151',
                    color: '#f9fafb',
                  }}
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#2563eb', color: '#f9fafb' }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p
              className="mt-6 text-center text-sm"
              style={{ color: '#9ca3af' }}
            >
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium hover:underline"
                style={{ color: '#2563eb' }}
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
