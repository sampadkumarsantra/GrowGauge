'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui/field';

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorParam, setErrorParam] = useState<string | null>(null);

  const callbackUrl = '/dashboard';

  const urlError = (key: string | null): string | null => {
    if (!key) return null;
    const known: Record<string, string> = {
      AuthError: 'Authentication failed. The email or password you entered is incorrect.',
      CredentialsSignin: 'Authentication failed. The email or password you entered is incorrect.',
      AccountExistsSignin: 'An account already exists for this email. Sign in with your email and password instead.',
    };
    return known[key] ?? 'Sign-in failed. Please try again.';
  };

  const caretMessage = () =>
    [
      errorParam,
      formError,
    ]
      .filter((m): m is string => Boolean(m))
      .map((m) => <p key={m}>{m}</p>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
        callbackUrl,
      });

      if (result?.error) {
        setFormError(urlError(result.error) ?? 'Sign-in failed. Please try again.');
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setFormError('Sign-in failed. Please try again.');
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="page-title">Sign in</h1>
        <p className="subtle">Paste the scorecard link you received, then sign in to save it to your dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="you@example.com"
                required
              />
            </Field>
          </div>

          <div>
            <Field label="Password">
              <input
                type="password"
                autoComplete="current-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="Your password"
                required
              />
            </Field>
          </div>

          {caretMessage().length > 0 && (
            <div role="alert" className="alert-error">
              {caretMessage()}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {googleEnabled && (
          <div className="mt-4">
            <div className="divider-with-label">
              <span>or</span>
            </div>
            <a href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="btn btn-quiet w-full">
              Continue with Google
            </a>
          </div>
        )}

        <p className="mt-6 center-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold">
            Sign up
          </Link>
        </p>
        <p className="mt-2 center-muted">
          <Link href="/forgot-password" className="font-semibold">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}