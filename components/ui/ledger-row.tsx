import React from 'react';
import clsx from 'clsx';

export type LedgerTone = 'indigo' | 'leaf' | 'neutral' | 'clay';

export interface LedgerRowProps {
  label: string;
  sub?: string;
  value: string;
  pct: number;
  tone?: LedgerTone;
}

export function LedgerRow({ label, sub, value, pct, tone = 'indigo' }: LedgerRowProps) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="ledger-row">
      <div>
        <div className="ledger-label">{label}</div>
        {sub && <div className="ledger-sub">{sub}</div>}
        <div className="ledger-track">
          <div
            className={clsx(
              'ledger-fill',
              tone === 'leaf' && 'strong',
              tone === 'neutral' && 'neutral'
            )}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
      <div className="ledger-value">{value}</div>
    </div>
  );
}