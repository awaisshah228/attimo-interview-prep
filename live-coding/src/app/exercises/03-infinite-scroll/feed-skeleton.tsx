export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-zinc-800 p-5"
        >
          <div className="h-5 w-3/4 rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-1/4 rounded bg-zinc-800" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-zinc-800" />
            <div className="h-3 w-5/6 rounded bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
