'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui/field';
import AuthShell from '@/components/ui/auth-shell';

export default function ForgotPasswordForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((e.currentTarget as HTMLFormElement).checkValidity() === false) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setError('Too many requests. Please wait a few minutes and try again.');
        setIsSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Could not send the reset link. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Could not send the reset link. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Reset link sent" subtitle="">
        <div className="text-center space-y-4">
          <p className="text-[14px] text-ink-soft leading-relaxed">
            If an account exists for <strong className="text-ink">{email}</strong>, a password
            reset link is on its way. It expires in 1 hour.
          </p>
          <Link href="/login" className="btn btn-primary w-full">
            Back to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email you used to register.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            name="email"
            className="field-field w-full"
            placeholder="you@example.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </Field>

        {error && <p className="text-[13px] text-clay">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? 'Sending linkâ€¦' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-[13px] text-ink-soft text-center">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}