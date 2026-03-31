export function Concepts({ items }: { items: string[] }) {
  return (
    <details className="mt-10">
      <summary className="cursor-pointer text-sm font-medium text-zinc-300">
        Key concepts tested
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}
