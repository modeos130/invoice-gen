'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { getAuthErrorMessage, withAuthTimeout } from '@/lib/auth-timeout';
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      setLoading(false);
      return;
    }

    try {
      const emailRedirectTo = `${window.location.origin}/dashboard`;
      const { error: authError } = await withAuthTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
          },
        }),
        'Account creation timed out. Check your connection and try again.',
      );

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch (authError) {
      setError(getAuthErrorMessage(authError, 'Account creation failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={success ? 'Check your email' : 'Create account'}
      description={success ? 'Confirm your account to finish setup.' : 'Start with a secure invoice workspace.'}
      footer={!success ? (
        <p>
          Already have an account?{' '}
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      ) : undefined}
    >
        {success ? (
          <div className="auth-state">
            <div className="auth-alert auth-alert-success" role="status">
              Check your email to confirm your account.
            </div>
            <p>
              We sent a confirmation link to <strong>{email}</strong>.
            </p>
            <Link href="/login" className="auth-link">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="you@example.com"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirm-password">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-primary"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="auth-small-copy">
                By creating an account, you agree to the{' '}
                <Link href="/terms" className="auth-link">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="auth-link">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </>
        )}
    </AuthShell>
  );
}
