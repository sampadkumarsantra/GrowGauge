import React from 'react';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <GrowGaugeMark variant="simplified" color="full" className="w-10" label="GrowGauge" />
        </div>

        <header className="text-center space-y-1.5 mb-6">
          <h1 className="font-slab text-2xl sm:text-[26px] font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed">{subtitle}</p>
          )}
        </header>

        <div className="sheet px-5 sm:px-7 py-6">{children}</div>
      </div>
    </div>
  );
}
