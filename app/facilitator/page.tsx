'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Field, TextInput } from '@/components/ui/field';

interface MePayload {
  user?: { id: string; email: string; role: string };
}

export default function FacilitatorCreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MePayload | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setMe(data);
          if (data.user?.role === 'facilitator') {
            const facRes = await fetch('/api/facilitator/me');
            if (facRes.ok) {
              const fac = await facRes.json();
              if (fac.facilitatorId) {
                router.push(`/facilitator/${fac.facilitatorId}`);
                return;
              }
            }
          }
        }
      } catch {
        /* not signed in */
      } finally {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/facilitator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organization }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create facilitator dashboard');
      }

      const data = await res.json();
      router.push(`/facilitator/${data.id}?token=${data.accessToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return <div className="min-h-[40vh] text-center text-ink-soft text-sm pt-16">Loading…</div>;
  }

  const loggedIn = Boolean(me?.user);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-14">
      <header className="space-y-2 mb-8">
        <p className="section-kicker">CBBO / Facilitator</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">
          Track the FPOs you support
        </h1>
        <p className="text-[14px] text-ink-soft leading-relaxed">
          Create a dashboard, share one assessment-invite link with the FPOs you support, and
          follow their credit-readiness over time.
        </p>
      </header>

      {!loggedIn && (
        <div className="mb-6 sheet-tint px-5 sm:px-6 py-4 text-[13px] text-ink-soft leading-relaxed">
          Dashboard accounts now need a GrowGauge login so your referral data stays with your
          organisation across sessions. Already registered?{' '}
          <Link href="/login?callbackUrl=/facilitator" className="font-semibold">
            Log in
          </Link>{' '}
          — then return here to create a dashboard.{' '}
          <Link href="/register" className="font-semibold">
            Create an account
          </Link>
        </div>
      )}

      <div className="sheet px-5 sm:px-8 py-6">
        <form onSubmit={handleCreate} className="space-y-5">
          <Field label="Facilitator name">
            <TextInput
              type="text"
              placeholder="e.g. Sushma Devi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field label="Organization (CBBO / NGO / Agency)">
            <TextInput
              type="text"
              placeholder="e.g. JSS Krishi Vikas Kendra"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
            />
          </Field>

          {error && <p className="text-[13px] text-clay">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
            {isSubmitting ? 'Creating dashboard…' : 'Create my dashboard'}
          </button>
        </form>

        <p className="text-[12px] text-ink-mute mt-6 leading-relaxed">
          {loggedIn
            ? 'Your dashboard is linked to your account, and also keeps its private access-token link for quick sharing.'
            : 'No password is needed. Your dashboard is secured with a private access token embedded in its link — treat it like a password.'}
        </p>
      </div>
    </div>
  );
}