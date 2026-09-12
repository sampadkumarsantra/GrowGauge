'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

interface ResearchSummary {
  generatedAt: string | null;
  submissionCount: number;
  minSubmissionsRequired: {
    perDistrict: number;
    perCell: number;
  };
  note: string;
  bandDistribution: Record<string, number>;
}

export default function ResearcherPage() {
  const [summary, setSummary] = useState<ResearchSummary | null>(null);

  useEffect(() => {
    fetch('/api/research/export')
      .then((r) => (r.ok ? r.json() : null))
      .then(setSummary)
      .catch(() => null);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Hero */}
      <header className="space-y-3">
        <GrowGaugeMark variant="full" color="ink" className="w-16 mb-3" />
        <p className="section-kicker">Open aggregate dataset</p>
        <h1 className="font-slab text-3xl font-semibold tracking-tight text-ink">
          GrowGauge Researcher Export
        </h1>
        <p className="text-[14px] text-ink-soft leading-relaxed max-w-xl">
          Aggregated, anonymised statistics from GrowGauge assessments — score
          distributions, factor averages by district/state/registration type,
          and submission counts. Never individual submissions.
        </p>
      </header>

      {/* Download */}
      <section className="sheet px-5 sm:px-6 py-5 space-y-4">
        <p className="section-kicker mb-2">Download the dataset</p>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/api/research/export?format=json"
            className="btn btn-quiet inline-flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="w-4 h-4" />
            JSON
          </a>
          <a
            href="/api/research/export?format=csv"
            className="btn btn-quiet inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </a>
        </div>

        {summary && (
          <div className="mt-3 text-[13px] text-ink-soft space-y-2">
            <p>
              <span className="font-semibold text-ink">{summary.submissionCount}</span>{' '}
              scored assessment(s) contributed to the public dataset.
            </p>
            <p>{summary.note}</p>
            {Object.keys(summary.bandDistribution).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute mb-1">
                  Band distribution (included rows)
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {Object.entries(summary.bandDistribution).map(([band, count]) => (
                    <span key={band} className="font-mono text-ink">
                      {band}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {summary && summary.submissionCount === 0 && (
          <p className="mt-3 text-[13px] text-ink-soft leading-relaxed">
            The dataset is currently empty. Once enough FPOs complete the
            credit-readiness assessment, aggregate rows will appear here.
          </p>
        )}
      </section>

      {/* Methodology note */}
      <section className="space-y-3">
        <p className="section-kicker">Methodology and disclosure control</p>
        <div className="sheet px-5 sm:px-6 py-5 space-y-4 text-[13px] text-ink-soft leading-relaxed">
          <p>
            GrowGauge uses the Weighted Composite Index method to derive a single
            0–100 credit-readiness score from six factors: Membership Strength,
            Revenue Stability, Cost Efficiency, Diversification, Market Linkage,
            and Governance. The same open methodology is used for the leaderboard,
            individual assessments, and this dataset.
          </p>
          <p>
            <strong className="text-ink">Disclosure control.</strong> A district-level aggregate is
            included only after a minimum of 5 scored submissions for that
            district. Individual (registration type × band) cells within a
            district are further suppressed until they contain at least 5
            submissions. No FPO name, access token, email address, or exact
            financial value is included in the export.
          </p>
        </div>
      </section>

      {/* Citation */}
      <section className="space-y-3">
        <p className="section-kicker">How to cite</p>
        <div className="sheet px-5 sm:px-6 py-5 text-[13px] leading-relaxed">
          <p className="text-ink">
            GrowGauge Aggregate Dataset,{' '}
            {new Date().getFullYear()}. Available at{' '}
            <Link href="/research" className="text-indigo hover:text-indigo-soft underline hover:underline-offset-4">
              growgauge.in/research
            </Link>
            .
          </p>
          <p className="mt-3 text-ink-soft">
            Methodology: Weighted Composite Index using HHI (diversification),
            Coefficient of Variation (revenue stability), Operating Ratio
            (cost efficiency), and governance-compliance scoring. Scoring
            weights formulated in research collaboration with agricultural
            economists at{' '}
            <strong className="text-ink">ICAR-IARI Jharkhand</strong>.
          </p>
        </div>
      </section>

      {/* Further reading */}
      <section>
        <Link
          href="/about"
          className="text-[13px] font-semibold text-indigo hover:text-indigo-soft underline hover:underline-offset-4"
        >
          Read the full scoring methodology →
        </Link>
      </section>
    </div>
  );
}