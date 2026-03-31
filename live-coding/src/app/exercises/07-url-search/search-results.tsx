import { getPosts } from "@/lib/data";

export async function SearchResults({ query }: { query?: string }) {
  if (!query) {
    return (
      <p className="py-8 text-center text-zinc-500">
        Type to search posts...
      </p>
    );
  }

  // Simulate delay
  await new Promise((r) => setTimeout(r, 500));

  const allPosts = getPosts(1, 100);
  const q = query.toLowerCase();
  const results = allPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q)
  );

  if (results.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">
        No results for &quot;{query}&quot;
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {results.slice(0, 20).map((post) => (
        <li
          key={post.id}
          className="rounded-lg border border-zinc-800 p-4"
        >
          <h3 className="font-medium text-zinc-200">{post.title}</h3>
          <p className="mt-1 text-xs text-zinc-500">by {post.author}</p>
        </li>
      ))}
      {results.length > 20 && (
        <p className="text-center text-sm text-zinc-500">
          Showing 20 of {results.length} results
        </p>
      )}
    </ul>
  );
}
