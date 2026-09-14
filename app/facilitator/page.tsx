'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FacilitatorCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/facilitator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push('/login?callbackUrl=/facilitator');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create facilitator dashboard');
      }

      router.push(`/facilitator/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-14">
      <header className="space-y-2 mb-8">
        <p className="section-kicker">CBBO / Facilitator</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">
          Track the FPOs you support
        </h1>
        <p className="text-[14px] text-ink-soft leading-relaxed">
          Activate your dashboard, share one assessment-invite link with the FPOs you support, and
          follow their credit-readiness over time.
        </p>
      </header>

      <div className="sheet px-5 sm:px-8 py-6">
        <form onSubmit={handleCreate} className="space-y-5">
          {error && <p className="text-[13px] text-clay">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
            {isSubmitting ? 'Creating dashboard…' : 'Create my dashboard'}
          </button>
        </form>

        <p className="text-[12px] text-ink-mute mt-6 leading-relaxed">
          Your dashboard is tied to your logged-in GrowGauge account. FPOs you refer fill the
          assessment with your invite link, and their scorecards land here automatically.
        </p>
      </div>
    </div>
  );
}