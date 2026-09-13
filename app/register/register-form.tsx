'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui/field';

export default function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const callbackUrl = '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Could not create your account. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setCreated(true);
    } catch {
      setError('Could not create your account. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-14 text-center">
        <p className="section-kicker mb-2">Check your inbox</p>
        <h1 className="font-slab text-2xl font-semibold text-ink">Account created</h1>
        <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">
          We sent a verification link to <strong className="text-ink">{email}</strong>. Verify your
          email to save assessments to your account and claim existing scorecards — then log in below.
        </p>
        <div className="mt-6 space-x-3">
          <Link href="/login" className="btn btn-primary">Go to log in</Link>
        </div>
        <p className="mt-4 text-[12px] text-ink-mute">
          Didn't get the email? Check your spam folder, or{' '}
          <Link href={`/login?email=${encodeURIComponent(email)}&unverified=1`} className="font-semibold">
            request a new link
          </Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
      <header className="space-y-2 mb-8">
        <p className="section-kicker">GrowGauge account</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">Create an account</h1>
        <p className="text-[14px] text-ink-soft leading-relaxed">
          Keep every assessment, score history and improvement roadmap in one place — share the
          private link with lenders whenever you need to.
        </p>
      </header>

      <div className="sheet px-5 sm:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Name" optional>
            <input
              type="text"
              autoComplete="name"
              className="field-field"
              placeholder="e.g. Sushma Devi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

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

          <Field label="Password" hint="At least 8 characters.">
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

          <Field label="Confirm password">
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {googleEnabled && (
          <div className="mt-4">
            <div className="flex items-center gap-3 my-4">
              <span className="h-px flex-1 bg-paper-line" />
              <span className="text-[11px] uppercase tracking-widest text-ink-mute font-semibold">or</span>
              <span className="h-px flex-1 bg-paper-line" />
            </div>
            <a href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="btn btn-quiet w-full">
              Sign up with Google
            </a>
          </div>
        )}

        <p className="mt-6 text-[13px] text-ink-soft text-center">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}