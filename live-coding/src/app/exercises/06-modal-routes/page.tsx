import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { PHOTOS } from "@/lib/data";
import { PhotoGrid } from "./photo-grid";

export default function ModalRoutesPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">06 — Modal with Intercepting Routes</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Click a photo to open it in a modal (intercepted route). Refresh or
        visit the URL directly to see the full-page version. The modal uses
        Radix Dialog for production-grade a11y (focus trap, Escape, portal).
      </p>

      <div className="mt-8">
        <PhotoGrid photos={PHOTOS} />
      </div>

      <Concepts
        items={[
          "Scratch modal: manual overlay + stopPropagation + router.back()",
          "Production modal: @radix-ui/react-dialog with focus trap, Escape, portal",
          "(.) intercepts same-level routes — click opens modal",
          "@modal is a parallel route slot rendered alongside children",
          "Direct URL visit loads the full page version",
        ]}
      />

      <div className="mt-6 rounded-lg border border-dashed border-zinc-700 p-4">
        <h3 className="text-sm font-semibold text-zinc-300">
          Production Library
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          <strong>@radix-ui/react-dialog</strong> — The intercepted modal at{" "}
          <code className="text-zinc-400">@modal/(.)photos/[id]/page.tsx</code>{" "}
          uses Radix Dialog for focus trapping, portal rendering, and proper ARIA
          labels. See <code className="text-zinc-400">photo-modal-production.tsx</code>.
        </p>
      </div>
    </main>
  );
}
