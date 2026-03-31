import { BackLink } from "@/components/back-link";
import { getPhoto } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PhotoFullPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = getPhoto(id);
  if (!photo) notFound();

  return (
    <main className="mx-auto max-w-lg p-8">
      <Link
        href="/exercises/06-modal-routes"
        className="text-sm text-zinc-400 hover:text-zinc-200"
      >
        &larr; Back to gallery
      </Link>

      <div
        className="mt-6 aspect-square w-full rounded-xl"
        style={{ backgroundColor: photo.color }}
      />

      <h1 className="mt-4 text-2xl font-bold">{photo.title}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This is the <strong>full page</strong> version. You see this when you
        visit the URL directly or refresh. The modal version is shown when
        navigating from the gallery via client-side navigation.
      </p>
    </main>
  );
}
