import Link from 'next/link';

export default function AboutPage() {
  const models = [
    {
      factor: 'Revenue Stability',
      weight: '20%',
      economicModel: 'Coefficient of Variation (CV = σ / μ)',
      formula: 'Revenue Stability Score = max(0, 100 - (CV × 100))',
      rationale:
        'Standard dispersion/risk measure in farm income and agricultural finance analysis. Normalizes standard deviation by average revenue across up to 3 years to penalize high annual volatility without punishing growth.',
    },
    {
      factor: 'Cost-to-Revenue Efficiency',
      weight: '20%',
      economicModel: 'Operating Ratio (OPEX / Gross Revenue)',
      formula: 'Cost Efficiency Score = max(0, min(100, (1.1 - Operating Ratio) / 0.4 × 100))',
      rationale:
        'Standard farm business analysis metric. Measures what proportion of gross revenue is absorbed by operating expenses. An operating ratio under 0.70 receives top scores, while ratios above 1.10 indicate working capital deficits.',
    },
    {
      factor: 'Crop & Product Diversification',
      weight: '15%',
      economicModel: 'Herfindahl–Hirschman Index (HHI = Σ(share_i)²)',
      formula: 'Diversification Score = (1 - HHI) × 100',
      rationale:
        'Standard concentration and risk measure from industrial and agricultural economics. A mono-crop FPO has HHI = 1.0 (score = 0), whereas balanced multi-crop portfolios reduce single-commodity market crash vulnerability.',
    },
    {
      factor: 'Membership Strength',
      weight: '15%',
      economicModel: 'Scale Threshold + 2-Year Retention Ratio',
      formula: 'Size Score (50%) + Retention Score (50%)',
      rationale:
        'Assesses collective bargaining scale. 200 active members represents the recognized commercial operating viability benchmark in India. Retention rate relative to 2 years prior penalizes shareholder churn.',
    },
    {
      factor: 'Market Linkage Strength',
      weight: '15%',
      economicModel: "Off-Taker Diversification, Contracts & Farmer's Share of Consumer Rupee",
      formula: 'Buyer Base (30%) + Forward Contract Share (30%) + Price Capture (40%)',
      rationale:
        "Combines buyer diversification (mitigating single off-taker default risk) with formalized forward agreements and the Farmer's Share of the Consumer Rupee (measuring post-harvest value retention).",
    },
    {
      factor: 'Governance & Compliance',
      weight: '15%',
      economicModel: 'Institutional Maturity & Statutory Compliance Index',
      formula: 'Audited Accounts (40 pts) + AGM (30 pts) + Board Meetings (30 pts)',
      rationale:
        'Proxy for institutional reliability and corporate fiduciary diligence. Commercial lenders mandate audited balance sheets and regular board meetings as non-negotiable credit pre-conditions.',
    },
  ];

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Back */}
      <p className="mb-10">
        <Link href="/" className="btn-link">
          ← Back home
        </Link>
      </p>

      {/* Header */}
      <header className="space-y-4">
        <p className="section-kicker">Economic methodology &amp; theoretical framework</p>
        <h1 className="font-slab text-3xl sm:text-4xl font-semibold tracking-tight text-ink leading-tight">
          How GrowGauge Evaluates FPO Health
        </h1>
        <p className="text-[15px] text-ink-soft leading-relaxed">
          Unlike opaque credit scoring or black-box algorithms, GrowGauge uses an open,
          transparent, and deterministic framework grounded in established agricultural economics
          and institutional risk modeling.
        </p>
      </header>

      {/* Disclaimer */}
      <p className="mt-8 text-[13px] leading-relaxed text-ink-soft border border-paper-line bg-white px-4 py-3">
        <strong className="text-ink">Self-assessment diagnostic notice.</strong> GrowGauge is an
        independent diagnostic and self-improvement tool designed to assist FPOs, CBBOs, and loan
        officers. It is not an official bank credit rating nor a guarantee of loan sanction.
        Commercial banks, NABARD, and NBFCs maintain autonomous credit policies and conduct
        independent underwriting appraisals.
      </p>

      {/* Method */}
      <section className="mt-10 space-y-4">
        <h2 className="font-slab text-2xl font-semibold text-ink">
          The Weighted Composite Index Method
        </h2>
        <p className="text-[14px] text-ink-soft leading-relaxed">
          Farmer Producer Organizations operate across heterogeneous dimensions: member equity and
          scale, financial stability and margins, crop mix diversification, and statutory
          corporate compliance. GrowGauge uses the Weighted Composite Index method — the
          international standard for constructing multidimensional institutional viability
          metrics.
        </p>
        <p className="text-[13px] font-mono text-ink leading-relaxed bg-paper-tile border border-paper-line px-4 py-3">
          Overall Score = (Membership × 0.15) + (Revenue Stability × 0.20) + (Cost Efficiency ×
          0.20) + (Product Diversification × 0.15) + (Market Linkage × 0.15) + (Governance × 0.15)
        </p>
      </section>

      {/* Factors */}
      <section className="mt-12 space-y-10">
        <header className="space-y-2">
          <p className="section-kicker">Detailed breakdown</p>
          <h2 className="font-slab text-2xl font-semibold text-ink">6 Core Economic Indicators</h2>
          <p className="text-[13px] text-ink-mute">
            Economic basis, equations, and rationale for all six sub-scores.
          </p>
        </header>

        {models.map((m, idx) => (
          <section
            key={idx}
            className="border-t border-paper-line pt-6 space-y-3"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-slab text-xl font-semibold text-ink">{m.factor}</h3>
              <span className="font-mono text-[12px] font-bold text-ink-mute">{m.weight}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-soft">
              <strong className="text-ink font-semibold">Model — </strong>
              {m.economicModel}
            </p>
            <p className="text-[13px] font-mono text-ink bg-paper-tile border border-paper-line px-3 py-2 leading-relaxed">
              {m.formula}
            </p>
            <p className="text-[14px] leading-relaxed text-ink-soft">{m.rationale}</p>
          </section>
        ))}
      </section>

      {/* Attribution */}
      <section className="mt-12 border-t border-paper-line pt-6 space-y-4">
        <h3 className="font-slab text-xl font-semibold text-ink">Research &amp; attribution</h3>
        <p className="text-[14px] leading-relaxed text-ink-soft">
          The scoring weights and quantitative models were formulated in research collaboration
          with agricultural economists at ICAR-IARI Jharkhand. This tool directly addresses
          information asymmetry between grassroots farmer institutions and formal banking channels
          across India.
        </p>
        <p className="pt-2">
          <Link href="/assess" className="btn btn-primary">
            Begin an assessment
          </Link>
        </p>
      </section>
    </article>
  );
}