export function DemoCard() {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-700 p-6">
      <h3 className="text-lg font-semibold">Sample Card</h3>
      <p className="text-sm text-zinc-400">
        This card shows how the theme affects UI elements. Toggle between dark
        and light to see the CSS variables update the background and foreground
        colors.
      </p>
      <div className="flex gap-2">
        <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white">
          Primary
        </button>
        <button className="rounded border border-zinc-600 px-4 py-2 text-sm">
          Secondary
        </button>
      </div>
      <div className="flex gap-3 text-sm text-zinc-400">
        <span className="rounded bg-zinc-800 px-2 py-1">Tag A</span>
        <span className="rounded bg-zinc-800 px-2 py-1">Tag B</span>
        <span className="rounded bg-zinc-800 px-2 py-1">Tag C</span>
      </div>
    </div>
  );
}
