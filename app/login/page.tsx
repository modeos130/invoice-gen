'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { getAuthErrorMessage, withAuthTimeout } from '@/lib/auth-timeout';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');

    if (authError === 'missing-code') {
      setError('The confirmation link was missing its sign-in code. Request a new verification email.');
    }

    if (authError === 'confirmation-failed') {
      setError('The confirmation link could not be verified. Request a new verification email.');
    }

    if (params.get('verified') === 'true') {
      setNotice('Email verified. Sign in to continue.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await withAuthTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        'Sign in timed out. Check your connection and try again.',
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      const redirect = new URLSearchParams(window.location.search).get('redirect');
      const destination = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/dashboard';

      router.replace(destination);
    } catch (authError) {
      setError(getAuthErrorMessage(authError, 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Open your invoice workspace."
      footer={(
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      )}
    >
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="auth-alert auth-alert-success" role="status">
              {notice}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="auth-link"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-primary"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
    </AuthShell>
  );
}
