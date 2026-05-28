'use client';
import { useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { getAuthErrorMessage, withAuthTimeout } from '@/lib/auth-timeout';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      const { error: resendError } = await withAuthTimeout(
        supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        }),
        'Verification resend timed out. Check your connection and try again.',
      );

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError, 'Verification resend failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      description="Confirm your account before opening the workspace."
      width="sm"
      footer={(
        <p>
          <Link href="/login" className="auth-link">
            Back to login
          </Link>
        </p>
      )}
    >
      <div className="auth-state">
        <p>Please check your inbox and click the verification link before continuing.</p>
        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            {error}
          </div>
        )}
        {sent && (
          <div className="auth-alert auth-alert-success" role="status">
            Verification email sent.
          </div>
        )}
        <input
          type="email"
          aria-label="Email"
          placeholder="Enter your email to resend"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="auth-input"
        />
        <button
          type="button"
          onClick={resend}
          disabled={loading || !email}
          className="auth-primary"
        >
          {loading ? 'Sending...' : sent ? 'Sent' : 'Resend verification email'}
        </button>
      </div>
    </AuthShell>
  );
}
