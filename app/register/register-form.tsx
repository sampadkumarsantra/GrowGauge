'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui/field';
import PasswordField from '@/components/ui/password-field';
import AuthShell from '@/components/ui/auth-shell';

export default function RegisterForm({
  googleEnabled,
  initialCallbackUrl = '/dashboard',
}: {
  googleEnabled: boolean;
  initialCallbackUrl?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

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
      <AuthShell title="Check your inbox" subtitle="">
        <div className="text-center space-y-4">
          <p className="text-[14px] text-ink-soft leading-relaxed">
            We sent a verification link to <strong className="text-ink">{email}</strong>. Verify
            your email to save assessments to your account and claim existing scorecards â€” then log
            in below.
          </p>
          <Link href="/login" className="btn btn-primary w-full">
            Go to log in
          </Link>
          <p className="text-[12px] text-ink-mute">
            Didn&apos;t get the email? Check your spam folder, or{' '}
            <Link
              href={`/login?email=${encodeURIComponent(email)}&unverified=1`}
              className="font-semibold"
            >
              request a new link
            </Link>
            .
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save every assessment and score â€” share your scorecard anytime."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" optional>
          <input
            type="text"
            autoComplete="name"
            name="name"
            className="field-field w-full"
            placeholder="e.g. Sushma Devi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            name="email"
            className="field-field w-full"
            placeholder="you@example.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="At least 8 characters."
          minLength={8}
        />

        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Repeat your password"
          minLength={8}
        />

        {error && <p className="text-[13px] text-clay">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting ? 'Creating accountâ€¦' : 'Create account'}
        </button>

        {googleEnabled && (
          <>
            <div className="flex items-center gap-3 my-4">
              <span className="h-px flex-1 bg-paper-line" />
              <span className="text-[11px] uppercase tracking-widest text-ink-mute font-semibold">
                or
              </span>
              <span className="h-px flex-1 bg-paper-line" />
            </div>
            <a
              href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(initialCallbackUrl)}`}
              className="btn btn-quiet w-full"
            >
              Sign up with Google
            </a>
          </>
        )}
      </form>

      <p className="mt-6 text-[13px] text-ink-soft text-center">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}