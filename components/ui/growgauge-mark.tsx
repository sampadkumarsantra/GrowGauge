import React from 'react';
import clsx from 'clsx';
import { MarkColor, MarkLayout, renderMarkSvg } from '@/lib/growgauge-mark';

interface GrowGaugeMarkProps {
  variant?: MarkLayout;
  color?: MarkColor;
  className?: string;
  label?: string;
}

export function GrowGaugeMark({
  variant = 'full',
  color = 'full',
  className,
  label = 'GrowGauge',
}: GrowGaugeMarkProps) {
  const svg = renderMarkSvg(variant, color);
  return (
    <span
      role="img"
      aria-label={label}
      className={clsx('inline-block leading-none select-none', className)}
      // The SVG is generated from the static template in lib/growgauge-mark.ts;
      // it never contains user input, so it is safe to inject.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}