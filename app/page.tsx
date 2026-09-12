import Link from 'next/link';
import LandingDemo from '@/components/landing-demo';
import { LedgerRow } from '@/components/ui/ledger-row';
import { buttonClass } from '@/components/ui/button';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

const BANDS = [
  { band: 'Strong', range: '80–100', note: 'Bank ready — competitive working capital and term loans.', tone: 'leaf' },
  { band: 'Moderate', range: '60–79', note: 'Credit eligible — structured financing with targeted improvements.', tone: 'indigo' },
  { band: 'Developing', range: '40–59', note: 'Near ready — strengthen governance and cost discipline.', tone: 'ink' },
  { band: 'Early Stage', range: '< 40', note: 'Capacity building — mobilise farmers, scale, formalise accounts.', tone: 'clay' },
] as const;

const FACTORS = [
  { label: 'Revenue Stability', model: 'Coefficient of Variation (CV = σ / μ)', weight: 20 },
  { label: 'Cost Efficiency', model: 'Operating Ratio (OPEX ÷ Gross Revenue)', weight: 20 },
  { label: 'Crop Diversification', model: 'Herfindahl-Hirschman Index (HHI)', weight: 15 },
  { label: 'Membership Strength', model: 'Scale + 2-year retention', weight: 15 },
  { label: 'Market Linkage', model: "Buyer diversity & farmer's rupee share", weight: 15 },
  { label: 'Governance & Compliance', model: 'Audit + AGM + board oversight', weight: 15 },
];

const BAND_TEXT: Record<string, string> = {
  leaf: 'text-leaf',
  indigo: 'text-indigo',
  ink: 'text-ink',
  clay: 'text-clay',
};

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* ── Hero: one sentence + the working demo ── */}
      <section className="py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        <div className="pt-2 sm:pt-4">
          <GrowGaugeMark variant="full" color="ink" className="w-[72px]" />
          <h1 className="font-slab text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.08] mt-4">
            Know your FPO&rsquo;s credit health.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft max-w-md">
            A free, self-serve diagnostic for Indian Farmer Producer Organisations: enter your
            operating data, get an objective 0–100 credit-readiness score, and walk into your bank
            with a report.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-start gap-3">
            <Link href="/assess" className={buttonClass('primary', 'w-full sm:w-auto')}>
              Check your FPO&rsquo;s score
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center px-1 py-1 text-sm font-medium text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
            >
              How the scoring works
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-ink-mute">
            Free and private — no login required. Your institutional data stays confidential.
          </p>
        </div>

        <div className="lg:pl-2">
          <LandingDemo />
        </div>
      </section>

      {/* ── Score bands: a compact table, not marketing cards ── */}
      <section className="py-10 border-t border-paper-line">
        <p className="section-kicker mb-4">What a score means</p>
        <div className="sheet overflow-x-auto">
          <table className="data-table min-w-[560px]">
            <thead>
              <tr>
                <th>Band</th>
                <th>Range</th>
                <th>Reading</th>
              </tr>
            </thead>
            <tbody>
              {BANDS.map((b) => (
                <tr key={b.band}>
                  <td className="w-28">
                    <span className={`font-semibold text-[13px] ${BAND_TEXT[b.tone]}`}>
                      {b.band}
                    </span>
                  </td>
                  <td className="w-24 font-mono text-[12px] text-ink">{b.range}</td>
                  <td className="text-[13px] text-ink-soft">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── The six factors: ledger rows with real weight bars ── */}
      <section className="py-10 border-t border-paper-line">
        <div className="flex items-baseline justify-between gap-6 mb-4">
          <p className="section-kicker">The method</p>
          <Link
            href="/about"
            className="text-[13px] font-medium text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
          >
            Read the full methodology
          </Link>
        </div>
        <div className="sheet px-5 sm:px-6 py-4">
          <div className="ledger">
            {FACTORS.map((f) => (
              <LedgerRow
                key={f.label}
                label={f.label}
                sub={f.model}
                value={`${f.weight}%`}
                pct={f.weight * 5}
                tone="indigo"
              />
            ))}
          </div>
        </div>
        <p className="mt-4 text-[13px] text-ink-soft max-w-2xl">
          Every point in a score traces back to an established economic model, applied without a
          black box. Scores range 0–100 across six weighted indicators.
        </p>
      </section>

      {/* ── Quiet close, no second Turmeric ── */}
      <section className="py-10 border-t border-paper-line">
        <p className="text-[15px] text-ink leading-relaxed max-w-2xl">
          Ten minutes of entry, an objective score, a staged improvement roadmap, and a
          bank-ready PDF report. No account, no marketing, no cost.
        </p>
        <div className="mt-4">
          <Link
            href="/assess"
            className="text-[14px] font-semibold text-indigo hover:text-indigo-soft no-underline hover:underline hover:underline-offset-4"
          >
            Start the assessment →
          </Link>
        </div>
      </section>
    </div>
  );
}