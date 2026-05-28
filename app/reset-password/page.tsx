'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { getAuthErrorMessage, withAuthTimeout } from '@/lib/auth-timeout';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
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

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await withAuthTimeout(
        supabase.auth.updateUser({ password }),
        'Password update timed out. Check your connection and try again.',
      );

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await withAuthTimeout(
        supabase.auth.signOut(),
        'Password was updated, but sign out timed out. Return to sign in and use the new password.',
      );
      setSuccess(true);
    } catch (updateError) {
      setError(getAuthErrorMessage(updateError, 'Password update failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Choose new password"
      description="Use the reset link from your email."
      width="sm"
    >
        {success ? (
          <div className="auth-state">
            <div className="auth-alert auth-alert-success" role="status">
              Password updated. Sign in with your new password.
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
              <label htmlFor="password">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="auth-input"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-primary"
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}
    </AuthShell>
  );
}
