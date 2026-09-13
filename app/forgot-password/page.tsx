'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Field } from '@/components/ui/field';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="max-w-md mx-auto px-4 sm:px-6 py-14 text-center">
        <p className="section-kicker mb-2">Check your inbox</p>
        <h1 className="font-slab text-2xl font-semibold text-ink">Reset link sent</h1>
        <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
          If an account exists for <strong className="text-ink">{email}</strong>, a password reset
          link is on its way. It expires in 1 hour.
        </p>
        <div className="mt-6">
          <Link href="/login" className="text-[13px] font-semibold">Back to log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
      <header className="space-y-2 mb-8">
        <p className="section-kicker">GrowGauge account</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">Forgot your password?</h1>
        <p className="text-[14px] text-ink-soft leading-relaxed">
          Enter the email you used to register and we&apos;ll send you a reset link.
        </p>
      </header>

      <div className="sheet px-5 sm:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              className="field-field"
              placeholder="you@example.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          {error && <p className="text-[13px] text-clay">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
            {isSubmitting ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-[13px] text-ink-soft text-center">
          Remembered it? <Link href="/login" className="font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-ink-mute">Loading…</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}