export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-border-default pb-4 space-y-2">
        <div className="h-7 w-40 rounded-lg bg-surface-secondary" />
        <div className="h-4 w-72 rounded bg-surface-secondary" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-surface p-6 shadow-card space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-surface-secondary" />
              <div className="h-4 w-32 rounded bg-surface-secondary" />
            </div>
            <div className="h-3 w-full rounded bg-surface-secondary" />
            <div className="h-3 w-5/6 rounded bg-surface-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}
