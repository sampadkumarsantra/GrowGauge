'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Field, Select, TextInput } from '@/components/ui/field';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

interface LeaderboardEntry {
  fpoName: string;
  band: string;
  score: number;
}

interface LeaderboardData {
  district: string;
  state: string | null;
  optedInCount: number;
  totalInDistrict: number;
  minSubmissionsRequired: number;
  available: boolean;
  entryCount: number;
  entries: LeaderboardEntry[];
  message: string | null;
}

const BAND_TEXT: Record<string, string> = {
  Strong: 'text-leaf',
  Moderate: 'text-indigo',
  Developing: 'text-ink',
  'Early Stage': 'text-clay',
};

export default function LeaderboardPage() {
  const [state, setState] = useState('Jharkhand');
  const [district, setDistrict] = useState('Ranchi');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = async () => {
    if (!district.trim()) {
      setError('Enter a district to view its leaderboard.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ district: district.trim(), state });
      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to load leaderboard');
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="space-y-2">
        <p className="section-kicker">District credit-readiness leaderboard</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">
          FPOs in your district, ranked
        </h1>
        <p className="text-[14px] text-ink-soft max-w-xl leading-relaxed">
          Only FPOs that explicitly opted in appear here. A board publishes once a district has
          enough opted-in assessments to be fair.
        </p>
      </header>

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchBoard();
        }}
        className="mt-8 sheet px-5 sm:px-6 py-5 flex flex-col sm:flex-row gap-4 items-end"
      >
        <div className="flex-1">
          <Field label="State">
            <Select value={state} onChange={(e) => setState(e.target.value)}>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex-1">
          <Field label="District">
            <TextInput
              placeholder="e.g. Ranchi"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </Field>
        </div>
        <button type="submit" disabled={loading} className="btn btn-quiet shrink-0">
          {loading ? 'Loading…' : 'View leaderboard'}
        </button>
      </form>

      {error && <p className="mt-4 text-[13px] text-clay">{error}</p>}

      {data && !data.available && (
        <div className="mt-6 border border-paper-line bg-white px-5 sm:px-6 py-6">
          <p className="font-slab text-xl font-semibold text-ink">Leaderboard not published yet</p>
          <p className="mt-1 text-[13px] text-ink-soft leading-relaxed">{data.message}</p>
          <p className="mt-2 text-[12px] text-ink-mute">
            {data.optedInCount} opted-in assessment(s) in this district out of {data.totalInDistrict}{' '}
            total submission(s).
          </p>
        </div>
      )}

      {data && data.available && (
        <>
          <div className="mt-8 flex items-baseline justify-between gap-4 border-b border-paper-line pb-3">
            <div>
              <h2 className="font-slab text-2xl font-semibold text-ink">{data.district}</h2>
              <p className="text-[12px] text-ink-mute">
                {data.entryCount} opted-in FPOs ranked by overall score
              </p>
            </div>
            <Link href="/assess" className="btn btn-primary">
              Add your FPO
            </Link>
          </div>

          <table className="data-table mt-3">
            <thead>
              <tr>
                <th className="w-12">Rank</th>
                <th>FPO</th>
                <th>Band</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry, idx) => (
                <tr key={entry.fpoName + idx}>
                  <td className="font-mono text-ink-mute">{idx + 1}</td>
                  <td className="text-ink font-medium">{entry.fpoName}</td>
                  <td className={BAND_TEXT[entry.band] ?? 'text-ink'}>{entry.band}</td>
                  <td className="text-right font-mono font-bold text-ink">
                    {entry.score.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}