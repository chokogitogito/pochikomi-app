export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-border-default pb-4 space-y-2">
        <div className="h-7 w-48 rounded-lg bg-surface-secondary" />
        <div className="h-4 w-80 rounded bg-surface-secondary" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-surface p-6 shadow-card space-y-3"
          >
            <div className="h-3 w-20 rounded bg-surface-secondary" />
            <div className="h-8 w-24 rounded-lg bg-surface-secondary" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border-default bg-surface p-6 shadow-card">
        <div className="h-64 w-full rounded-xl bg-surface-secondary" />
      </div>
    </div>
  );
}
