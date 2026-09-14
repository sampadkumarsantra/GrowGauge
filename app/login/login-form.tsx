'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui/field';
import PasswordField from '@/components/ui/password-field';
import AuthShell from '@/components/ui/auth-shell';

function urlError(key: string | null): string | null {
  if (!key) return null;
  const known: Record<string, string> = {
    Configuration: 'Sign-in failed. The server is misconfigured. Please try again later.',
    AccessDenied: 'Sign-in was denied.',
    Verification: 'The sign-in link has expired. Sign in again.',
    OAuthAccountNotLinked: 'An account with this email already exists. Log in with email and password.',
    OAuthSignin: 'Google sign-in was cancelled — try again or use email instead.',
    OAuthCallback: 'Google sign-in failed. Please try again.',
    OAuthCreateAccount: 'Could not create your Google account. Please try again.',
    EmailCreateAccount: 'Could not create your account. Please try again.',
    Callback: 'Sign-in failed. Please try again.',
    AuthError: 'The email or password you entered is incorrect.',
    CredentialsSignin:
      'The email or password is incorrect. If you just signed up, verify your email first.',
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
    <AuthShell title="Log in to GrowGauge" subtitle="Access your saved assessments and scorecards.">
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
          {submitting ? 'Logging in\u2026' : 'Log in'}
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
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
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
