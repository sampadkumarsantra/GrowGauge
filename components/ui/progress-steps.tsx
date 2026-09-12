import React from 'react';
import clsx from 'clsx';

interface ProgressStepsProps {
  current: number;
  total: number;
  labels: string[];
  onJump?: (step: number) => void;
}

/**
 * Thin progress line + step count — the deliberate alternative to a heavy
 * stepper widget. Completed steps are quiet Indigo text links; the current
 * step is set in Ink; upcoming steps stay muted and disabled.
 */
export function ProgressSteps({ current, total, labels, onJump }: ProgressStepsProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[13px] font-semibold text-ink">
          Step {current} of {total} — {labels[current - 1]}
        </p>
      </div>
      <div className="h-[3px] bg-paper-line rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo transition-[width] duration-300 ease-out"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {labels.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={n > current}
                onClick={() => done && onJump?.(n)}
                className={clsx(
                  'inline-flex items-baseline gap-1 text-[12px] transition-colors',
                  active && 'font-bold text-ink no-underline',
                  done &&
                    'font-medium text-indigo underline decoration-transparent hover:decoration-current underline-offset-4 cursor-pointer',
                  n > current && 'text-ink-mute cursor-not-allowed'
                )}
              >
                <span className="font-mono text-[10px]">{String(n).padStart(2, '0')}</span>
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}