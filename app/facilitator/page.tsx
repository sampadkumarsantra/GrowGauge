'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, TextInput } from '@/components/ui/field';

export default function FacilitatorCreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
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
          No password needed. Your dashboard is secured with a private access token embedded in
          its link — treat it like a password. Share only the assessment-invite link with FPOs.
        </p>
      </div>
    </div>
  );
}