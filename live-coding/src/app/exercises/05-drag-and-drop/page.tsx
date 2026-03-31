import { BackLink } from "@/components/back-link";
import { Concepts } from "@/components/concepts";
import { Tabs } from "@/components/tabs";
import { SortableList } from "./sortable-list";
import { SortableListProduction } from "./sortable-list-production";

export default function DragAndDropPage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold">05 — Drag-and-Drop Sortable List</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Scratch uses native HTML DnD API. Production uses @dnd-kit with full
        keyboard + touch + screen reader support.
      </p>

      <div className="mt-8">
        <Tabs
          items={[
            { label: "From Scratch (Native DnD)", content: <SortableList /> },
            {
              label: "With @dnd-kit",
              content: <SortableListProduction />,
            },
          ]}
        />
      </div>

      <Concepts
        items={[
          "Scratch: HTML5 Drag and Drop API, useRef for dragOverIndex, splice reorder",
          "Production: @dnd-kit with PointerSensor + KeyboardSensor",
          "@dnd-kit — Tab to focus, Space to pick up, Arrow keys to move, Space to drop",
          "CSS.Transform for smooth animations without layout shifts",
        ]}
      />
    </main>
  );
}
