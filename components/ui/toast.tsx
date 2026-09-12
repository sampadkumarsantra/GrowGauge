'use client';

import React from 'react';
import clsx from 'clsx';

interface ToastProps {
  show: boolean;
  tone?: 'success' | 'error';
  children: React.ReactNode;
}

/** Single toast style, used for all success and error messages. */
export function Toast({ show, tone = 'success', children }: ToastProps) {
  if (!show) return null;
  return (
    <div
      role="status"
      className={clsx(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] px-4 py-2.5 text-[13px] font-medium shadow-none border',
        tone === 'error'
          ? 'bg-clay text-white border-clay'
          : 'bg-ink text-paper border-ink'
      )}
    >
      {children}
    </div>
  );
}