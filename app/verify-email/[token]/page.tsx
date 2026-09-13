'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const rawToken = Array.isArray(token) ? token[0] : token;

  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!rawToken) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('ok');
          setMessage(data.message ?? 'Email verified.');
        } else {
          setStatus('error');
          setMessage(data.error ?? 'This verification link is invalid or has expired.');
        }
      } catch {
        setStatus('error');
        setMessage('Could not verify your email right now. Please try again.');
      }
    })();
  }, [rawToken]);

  if (status === 'loading') {
    return <div className="text-center py-20 text-ink-mute text-sm">Verifying your email…</div>;
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-14 text-center">
      <p className="section-kicker mb-2">GrowGauge account</p>
      <h1 className="font-slab text-2xl font-semibold text-ink">
        {status === 'ok' ? 'Email verified' : 'Verification failed'}
      </h1>
      <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">{message}</p>

      {status === 'ok' && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="btn btn-primary">Open my dashboard</Link>
          <Link href="/login" className="btn btn-quiet">Log in</Link>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login?unverified=1" className="btn btn-primary">Request a new link</Link>
          <Link href="/login" className="btn btn-quiet">Back to log in</Link>
        </div>
      )}
      <p className="mt-4 text-[12px] text-ink-mute">The verification link expires after 48 hours.</p>
    </div>
  );
}