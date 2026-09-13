'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Field } from '@/components/ui/field';

export default function ResetPasswordPage() {
  const { token } = useParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: Array.isArray(token) ? token[0] : token, password }),
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
      <div className="max-w-md mx-auto px-4 sm:px-6 py-14 text-center">
        <p className="section-kicker mb-2">Done</p>
        <h1 className="font-slab text-2xl font-semibold text-ink">Password updated</h1>
        <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
          Your password has been reset. You can now log in with the new one.
        </p>
        <div className="mt-6">
          <Link href="/login?reset=1" className="btn btn-primary">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
      <header className="space-y-2 mb-8">
        <p className="section-kicker">GrowGauge account</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">Set a new password</h1>
        <p className="text-[14px] text-ink-soft leading-relaxed">
          Choose a new password for your account.
        </p>
      </header>

      <div className="sheet px-5 sm:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="New password" hint="At least 8 characters.">
            <input
              type="password"
              autoComplete="new-password"
              className="field-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>

          <Field label="Confirm new password">
            <input
              type="password"
              autoComplete="new-password"
              className="field-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>

          {error && <p className="text-[13px] text-clay">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
            {isSubmitting ? 'Updating password…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}