import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { Autocomplete } from "./autocomplete";
import { AutocompleteProduction } from "./autocomplete-production";
import { AutocompleteAxios } from "./autocomplete-axios";

export default function AutocompletePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">01 — Autocomplete / Typeahead</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Debounce, AbortController, keyboard nav (Arrow Up/Down, Enter, Escape),
        ARIA combobox roles. Try typing &quot;react&quot; or &quot;next&quot;.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            { label: "From Scratch", content: <Autocomplete /> },
            {
              label: "With cmdk + TanStack Query",
              content: <AutocompleteProduction />,
            },
            {
              label: "With cmdk + TanStack Query + Axios",
              content: <AutocompleteAxios />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: manual debounce, AbortController, keyboard nav, ARIA roles",
          "Production: cmdk handles keyboard + ARIA, TanStack Query handles caching + dedup",
          "cmdk — 8kb, used by Vercel, Linear, Raycast dashboards",
          "TanStack Query — stale-while-revalidate, auto AbortController",
          "Axios — auto JSON parsing, param encoding, throws on 4xx/5xx, same AbortSignal support",
        ]}
      />
    </main>
  );
}
