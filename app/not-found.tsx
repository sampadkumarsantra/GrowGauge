import Link from 'next/link';
import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center px-4 text-center">
      <GrowGaugeMark variant="simplified" color="ink" className="w-12" label="GrowGauge" />
      <h1 className="mt-5 font-slab text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
        We couldn&rsquo;t find that page.
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        Head back to your{' '}
        <Link href="/dashboard" className="font-semibold">
          Dashboard
        </Link>
        .
      </p>
    </div>
  );
}