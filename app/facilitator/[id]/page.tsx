'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface FPOEntry {
  id: string;
  fpoName: string;
  state: string;
  district: string;
  createdAt: string;
  overallScore: number | null;
  band: string | null;
}

interface DashboardData {
  facilitatorId: string;
  name: string;
  totalFpos: number;
  assessedCount: number;
  fpos: FPOEntry[];
}

const BAND_TEXT: Record<string, string> = {
  Strong: 'text-leaf',
  Moderate: 'text-indigo',
  Developing: 'text-ink',
  'Early Stage': 'text-clay',
};

function Dashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const inviteUrl = data
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/assess?facilitatorId=${data.facilitatorId}`
    : '';

  const loadData = useCallback(async () => {
    if (!id) {
      setError('Missing facilitator ID. Please check your dashboard link.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/facilitator/${id}/fpos`);
      if (res.status === 401) {
        router.push(`/login?callbackUrl=/facilitator/${id}`);
        return;
      }
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load dashboard');
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyInvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 3000);
    }
  };

  if (loading) {
    return <div className="min-h-[40vh] text-center text-ink-soft text-sm pt-16">Loading dashboard…</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-slab text-2xl font-semibold text-ink">Dashboard access error</h1>
        <p className="text-sm text-ink-soft leading-relaxed">{error}</p>
        <Link href="/facilitator" className="btn-link">
          Open your dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <header className="border-b border-paper-line pb-5">
        <p className="section-kicker">CBBO / Facilitator dashboard</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink mt-1">
          {data.name}
        </h1>
        <p className="mt-3 text-[13px] text-ink-soft">
          <strong className="font-semibold text-ink">{data.totalFpos}</strong> referred FPO
          {data.totalFpos === 1 ? '' : 's'} ·{' '}
          <strong className="font-semibold text-ink">{data.assessedCount}</strong> assessed
        </p>
      </header>

      {/* Invite link — plain text + quiet copy */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-[12px] text-ink-mute break-all max-w-xl whitespace-pre-wrap">
          {inviteUrl}
        </span>
        <button type="button" onClick={copyInvite} className="btn-link whitespace-nowrap">
          {copiedInvite ? 'Invite link copied' : 'Copy FPO invite link'}
        </button>
        <Link href="/assess" className="btn-link whitespace-nowrap">
          Open assessment form
        </Link>
      </div>

      {/* Referred FPOs */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <p className="section-kicker">Referred FPOs</p>
        </div>

        {data.fpos.length === 0 ? (
          <div className="border border-paper-line bg-white px-5 sm:px-6 py-8 text-center">
            <p className="text-[13px] text-ink-soft">
              No FPOs yet. Copy your invite link above and share it with the FPOs you support.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>FPO</th>
                <th>Location</th>
                <th>Assessed on</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.fpos.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="text-ink font-medium">{f.fpoName}</span>
                    {f.band && (
                      <span className={`ml-2 text-[11px] font-semibold ${BAND_TEXT[f.band] ?? 'text-ink'}`}>
                        · {f.band}
                      </span>
                    )}
                  </td>
                  <td className="text-ink-soft">
                    {f.district}, {f.state}
                  </td>
                  <td className="text-ink-mute font-mono text-[12px] whitespace-nowrap">
                    {new Date(f.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="text-right font-mono font-bold text-ink">
                    {f.overallScore != null ? f.overallScore.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function FacilitatorDashboardPage() {
  return (
    <Suspense
      fallback={<div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-ink-mute">Loading…</div>}
    >
      <Dashboard />
    </Suspense>
  );
}