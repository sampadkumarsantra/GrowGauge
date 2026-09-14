'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/ui/auth-shell';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token provided.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
          setTimeout(() => router.replace('/dashboard'), 1200);
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus('error');
          setErrorMsg(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Could not reach the server. Please try again.');
      });
  }, [token, router]);

  if (status === 'loading') {
    return (
      <AuthShell title="Verifying your email" subtitle="">
        <p className="text-[14px] text-ink-soft text-center">Please wait\u2026</p>
      </AuthShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthShell title="Email verified" subtitle="">
        <div className="text-center space-y-4">
          <p className="text-[14px] text-ink-soft leading-relaxed">
            Your email has been verified. Taking you to your dashboard\u2026
          </p>
          <Link href="/dashboard" className="btn btn-primary w-full">
            Go to dashboard
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verification failed" subtitle="">
      <div className="text-center space-y-4">
        <p className="text-[14px] text-clay leading-relaxed">{errorMsg}</p>
        <Link href="/login" className="btn btn-primary w-full">
          Go to log in
        </Link>
      </div>
    </AuthShell>
  );
}
