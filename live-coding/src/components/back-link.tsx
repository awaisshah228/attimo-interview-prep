import Link from "next/link";

export function BackLink() {
  return (
    <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
      &larr; Back
    </Link>
  );
}
