'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui/field';
import PasswordField from '@/components/ui/password-field';
import AuthShell from '@/components/ui/auth-shell';

function urlError(key: string | null): string | null {
  if (!key) return null;
  const known: Record<string, string> = {
    AuthError: 'The email or password you entered is incorrect.',
    CredentialsSignin: 'The email or password you entered is incorrect.',
    AccountExistsSignin:
      'An account already exists for this email. Sign in with your email and password instead.',
  };
  return known[key] ?? 'Sign-in failed. Please try again.';
}

export default function LoginForm({
  googleEnabled,
  initialCallbackUrl = '/dashboard',
  initialError = null,
}: {
  googleEnabled: boolean;
  initialCallbackUrl?: string;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError ? urlError(initialError) : null);

  useEffect(() => {
    if (initialError) setError(urlError(initialError));
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((e.currentTarget as HTMLFormElement).checkValidity() === false) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
        callbackUrl: initialCallbackUrl,
      });
      if (result?.error) {
        setError(urlError(result.error) ?? 'Sign-in failed. Please try again.');
      } else if (result?.ok) {
        router.push(initialCallbackUrl);
        router.refresh();
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Log in to GrowGauge"
      subtitle="Access your saved assessments and scorecards."
    >
      <form onSubmit={handleSubmit} noValidate={false} className="space-y-4">
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

        <div className="space-y-1">
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Your password"
          />
          <p className="text-[12px] text-ink-mute text-right">
            <Link href="/forgot-password" className="font-semibold hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        {error && <p className="text-[13px] text-clay">{error}</p>}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? 'Logging inâ€¦' : 'Log in'}
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
              Continue with Google
            </a>
          </>
        )}
      </form>

      <p className="mt-6 text-[13px] text-ink-soft text-center">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}