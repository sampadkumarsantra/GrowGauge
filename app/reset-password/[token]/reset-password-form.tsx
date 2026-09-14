'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PasswordField from '@/components/ui/password-field';
import AuthShell from '@/components/ui/auth-shell';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((e.currentTarget as HTMLFormElement).checkValidity() === false) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setError('Too many attempts. Please wait a few minutes and try again.');
        setIsSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Could not reset your password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      setError('Could not reset your password. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="">
        <div className="text-center space-y-4">
          <p className="text-[14px] text-ink-soft leading-relaxed">
            Your password has been reset. You can now log in with the new one.
          </p>
          <Link href="/login" className="btn btn-primary w-full">
            Log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="At least 8 characters."
          minLength={8}
          autoFocus
        />

        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Repeat your password"
          minLength={8}
        />

        {error && <p className="text-[13px] text-clay">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? 'Updating password\u2026' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}
