import React from 'react';
import clsx from 'clsx';

interface ScoreTargetProps {
  /** 0–100 observed score; pass null to render the empty target with no needle. */
  score: number | null;
  className?: string;
}

const ZONES = [
  { x: 0, w: 40, cls: 'zt-early', label: 'Early Stage' },
  { x: 40, w: 20, cls: 'zt-dev', label: 'Developing' },
  { x: 60, w: 20, cls: 'zt-mod', label: 'Moderate' },
  { x: 80, w: 20, cls: 'zt-strong', label: 'Strong' },
] as const;

/**
 * The GrowGauge target board: a 0–100 gauge with the credit-readiness band
 * zones and the official band thresholds at 40 / 60 / 80, plus a needle for
 * the observed score. Rendered on a solid white panel so it reads the same
 * on paper sheets and tinted band surfaces.
 */
export function ScoreTarget({ score, className }: ScoreTargetProps) {
  const clamped = score == null ? null : Math.max(0, Math.min(100, score));
  const pastTarget = clamped != null && clamped >= 60;
  const atStrong = clamped != null && clamped >= 80;

  return (
    <div className={clsx('score-target', className)}>
      <svg viewBox="0 0 100 40" className="w-full h-auto" role="img" aria-label="Credit-readiness target gauge">
        <g className="zt-bar">
          {ZONES.map((z) => (
            <rect key={z.cls} x={z.x} y="16" width={z.w} height="8" rx="2" className={z.cls} />
          ))}
        </g>
        {[40, 60, 80].map((t) => (
          <g key={t}>
            <line x1={t} y1="14" x2={t} y2="26" className="zt-tick" />
            <text x={t} y="34" textAnchor="middle" className="zt-num">
              {t}
            </text>
          </g>
        ))}
        {clamped != null && (
          <>
            <line
              x1={clamped}
              y1="4"
              x2={clamped}
              y2="26"
              className={clsx('zt-needle', atStrong ? 'zt-needle-strong' : pastTarget ? 'zt-needle-hit' : 'zt-needle-gap')}
            />
            <circle
              cx={clamped}
              cy="4"
              r="2.6"
              className={clsx('zt-needle', atStrong ? 'zt-needle-strong' : pastTarget ? 'zt-needle-hit' : 'zt-needle-gap')}
            />
          </>
        )}
      </svg>
      <div className="zt-labels">
        {ZONES.map((z) => (
          <span key={z.cls} className="zt-label" style={{ flexBasis: `${z.w}%` }}>
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}