import React from 'react';
import clsx from 'clsx';

export interface ChecklistItemProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  recommended?: boolean;
  meta?: React.ReactNode;
}

export function ChecklistItem({ checked, onToggle, label, recommended, meta }: ChecklistItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={clsx(
        'w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition-colors border',
        checked
          ? 'bg-leaf-tint border-leaf/40'
          : 'bg-white border-paper-line hover:bg-indigo-tint'
      )}
    >
      <span
        className={clsx(
          'mt-0.5 w-4 h-4 rounded-[2px] border flex items-center justify-center text-[10px] font-bold shrink-0',
          checked ? 'bg-leaf border-leaf text-white' : 'border-ink-mute bg-white text-transparent'
        )}
      >
        ✓
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={clsx(
            'block text-[13px] leading-snug',
            checked ? 'text-ink-soft line-through decoration-ink-mute' : 'text-ink'
          )}
        >
          {label}
        </span>
        {recommended && <span className="text-[11px] text-ink-mute">recommended</span>}
        {meta && <span className="block mt-1.5">{meta}</span>}
      </span>
    </button>
  );
}