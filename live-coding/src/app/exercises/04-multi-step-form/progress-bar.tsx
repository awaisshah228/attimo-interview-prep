export function ProgressBar({
  steps,
  current,
}: {
  steps: number;
  current: number;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${
            i <= current ? "bg-blue-500" : "bg-zinc-800"
          }`}
        />
      ))}
    </div>
  );
}
