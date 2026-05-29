'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { getAuthErrorMessage, withAuthTimeout } from '@/lib/auth-timeout';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetError = params.get('reset_error');

    if (resetError === 'missing-code') {
      setError('The reset link was missing its sign-in code. Request a new reset link.');
    }

    if (resetError === 'link-failed') {
      setError('The reset link could not be verified. Request a new reset link.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const redirectTo = new URL('/auth/callback', window.location.origin);
      redirectTo.searchParams.set('next', '/reset-password');
      const { error: resetError } = await withAuthTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectTo.toString(),
        }),
        'Reset request timed out. Check your connection and try again.',
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError, 'Reset request failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      description="Send a secure reset link to your email."
      width="sm"
    >
        {sent ? (
          <div className="auth-state">
            <div className="auth-alert auth-alert-success" role="status">
              If an account exists for that email, a reset link is on the way.
            </div>
            <Link href="/login" className="auth-link">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                {error}
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
                onChange={(event) => setEmail(event.target.value)}
                className="auth-input"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-primary"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
    </AuthShell>
  );
}
