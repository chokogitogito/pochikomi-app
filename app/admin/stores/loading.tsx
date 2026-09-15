export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-border-default pb-4 space-y-2">
        <div className="h-7 w-32 rounded-lg bg-surface-secondary" />
        <div className="h-4 w-96 max-w-full rounded bg-surface-secondary" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-surface p-6 shadow-card space-y-3"
          >
            <div className="h-3 w-24 rounded-full bg-surface-secondary" />
            <div className="h-5 w-3/4 rounded bg-surface-secondary" />
            <div className="h-3 w-full rounded bg-surface-secondary" />
            <div className="h-3 w-2/3 rounded bg-surface-secondary" />
            <div className="pt-4 border-t border-border-subtle">
              <div className="h-9 w-full rounded-xl bg-surface-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
