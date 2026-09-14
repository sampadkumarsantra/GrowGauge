export default function ResultsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="h-32 bg-paper-tile border border-paper-line" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="flex-1 h-3 bg-paper-tile" />
            <div className="w-16 h-5 bg-paper-tile" />
          </div>
        ))}
      </div>
    </div>
  );
}