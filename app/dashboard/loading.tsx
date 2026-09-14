import { GrowGaugeMark } from '@/components/ui/growgauge-mark';

export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="border-b border-paper-line pb-5">
        <div className="w-28 h-3 bg-paper-tile mb-3" />
        <div className="w-48 h-8 bg-paper-tile" />
      </header>

      <section className="mt-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-24 h-3 bg-paper-tile" />
          <div className="ml-auto w-20 h-3 bg-paper-tile" />
        </div>
        <div className="sheet px-5 sm:px-6 py-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="flex-1 space-y-2">
                <div className="w-40 h-3.5 bg-paper-tile" />
                <div className="w-28 h-2.5 bg-paper-tile" />
              </div>
              <div className="w-12 h-5 bg-paper-tile" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}