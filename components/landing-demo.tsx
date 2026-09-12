'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FactorScores, FPOSubmissionInput, ScoreBand } from '@/lib/scoring';
import { LedgerRow } from '@/components/ui/ledger-row';
import { Toggle } from '@/components/ui/field';
import { buttonClass } from '@/components/ui/button';

const SAMPLE: FPOSubmissionInput = {
  fpoName: 'Pragati Kisan Producer Co. Ltd.',
  state: 'Jharkhand',
  district: 'Ranchi',
  registrationType: 'Producer Company',
  activeMembers: 150,
  members2YrAgo: 120,
  revenueYear1: 4200000,
  revenueYear2: 3800000,
  revenueYear3: 3500000,
  costYear1: 3100000,
  costYear2: 2900000,
  costYear3: 2700000,
  products: [
    { name: 'Paddy', revenueSharePct: 70 },
    { name: 'Vegetables', revenueSharePct: 30 },
  ],
  activeBuyersCount: 4,
  contractSalesPct: 40,
  estimatedPriceRealizationPct: 55,
  auditedAccounts: true,
  agmCountLastYear: 1,
  boardMeetingsLastYear: 5,
};

interface DemoScore {
  overallScore: number;
  band: ScoreBand;
  factorScores: FactorScores;
}

const BAND_WORD: Record<ScoreBand, string> = {
  Strong: 'Strong',
  Moderate: 'Moderate',
  Developing: 'Developing',
  'Early Stage': 'Early Stage',
};

const FACTORS: { key: keyof FactorScores; label: string }[] = [
  { key: 'membership', label: 'Membership Strength' },
  { key: 'revenueStability', label: 'Revenue Stability' },
  { key: 'costEfficiency', label: 'Cost Efficiency' },
  { key: 'diversification', label: 'Diversification' },
  { key: 'marketLinkage', label: 'Market Linkage' },
  { key: 'governance', label: 'Governance' },
];

export default function LandingDemo() {
  const [levers, setLevers] = useState({
    activeMembers: SAMPLE.activeMembers,
    activeBuyersCount: SAMPLE.activeBuyersCount,
    contractSalesPct: SAMPLE.contractSalesPct,
    estimatedPriceRealizationPct: SAMPLE.estimatedPriceRealizationPct ?? 55,
    auditedAccounts: SAMPLE.auditedAccounts,
  });
  const [score, setScore] = useState<DemoScore | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/score/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...SAMPLE, ...levers }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setScore(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (next: typeof levers) => {
    if (busyRef.current) return;
    busyRef.current = true;
    fetch('/api/score/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...SAMPLE, ...next }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setScore(data);
      })
      .catch(() => undefined)
      .finally(() => {
        busyRef.current = false;
      });
  };

  const set = (field: keyof typeof levers, val: number | boolean) => {
    const next = { ...levers, [field]: val };
    setLevers(next);
    run(next);
  };

  const band = score?.band;

  return (
    <div className="sheet p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="section-kicker">Live demo — drag the levers</p>
        <span className={`text-[12px] font-semibold ${band ? bandClass(band) : 'text-ink-mute'}`}>
          {band ? BAND_WORD[band] : '…'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-end gap-6">
        <p className="text-[11px] uppercase tracking-widest text-ink-mute font-semibold">Score</p>
        <div className="h-[3px] bg-paper-line rounded-full">
          <div
            className="h-full bg-indigo rounded-full transition-[width] duration-300"
            style={{ width: `${score?.overallScore ?? 0}%` }}
          />
        </div>
        <p className="font-slab text-4xl font-semibold leading-none text-ink tabular-nums">
          {score ? score.overallScore.toFixed(1) : '—'}
        </p>
      </div>

      <div className="ledger mt-5">
        {FACTORS.map(({ key, label }) => (
          <LedgerRow
            key={key}
            label={label}
            value={score ? score.factorScores[key].toFixed(1) : '—'}
            pct={score ? score.factorScores[key] : 0}
            tone={key === 'marketLinkage' ? 'neutral' : 'indigo'}
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft font-medium">Active members</span>
            <span className="font-mono font-bold text-ink">{levers.activeMembers}</span>
          </div>
          <input
            type="range"
            min={20}
            max={600}
            step={10}
            value={levers.activeMembers}
            onChange={(e) => set('activeMembers', Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft font-medium">Buyers / off-takers</span>
            <span className="font-mono font-bold text-ink">{levers.activeBuyersCount}</span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={levers.activeBuyersCount}
            onChange={(e) => set('activeBuyersCount', Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft font-medium">Forward contract sales</span>
            <span className="font-mono font-bold text-ink">{levers.contractSalesPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={levers.contractSalesPct}
            onChange={(e) => set('contractSalesPct', Number(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft font-medium">Farmer&apos;s share of consumer rupee</span>
            <span className="font-mono font-bold text-ink">
              {levers.estimatedPriceRealizationPct}%
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={90}
            step={5}
            value={levers.estimatedPriceRealizationPct}
            onChange={(e) => set('estimatedPriceRealizationPct', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-paper-line">
        <Toggle
          checked={levers.auditedAccounts}
          onChange={(v) => set('auditedAccounts', v)}
          label="Statutory audit completed"
          hint="Audited accounts hold 40 of 100 points in the governance factor."
        />
      </div>

      <div className="mt-5 pb-0">
        <a href="/assess" className={buttonClass('quiet', 'w-full')}>
          Assess your own FPO
        </a>
      </div>
    </div>
  );
}

function bandClass(band: ScoreBand): string {
  switch (band) {
    case 'Strong':
      return 'band-strong';
    case 'Moderate':
      return 'band-moderate';
    case 'Developing':
      return 'band-developing';
    case 'Early Stage':
      return 'band-early';
  }
}