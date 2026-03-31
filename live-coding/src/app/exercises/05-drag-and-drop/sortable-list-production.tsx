"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/*
 * Production: @dnd-kit + shadcn/ui
 *
 * - Full keyboard a11y (Tab, Space, Arrow keys)
 * - Touch + pointer support
 * - Screen reader announcements
 * - CSS transform animations (no layout shifts)
 */

type Item = { id: string; label: string };

const INITIAL: Item[] = [
  { id: "1", label: "Learn React fundamentals" },
  { id: "2", label: "Build a Next.js app" },
  { id: "3", label: "Add TypeScript" },
  { id: "4", label: "Style with Tailwind" },
  { id: "5", label: "Deploy to Vercel" },
  { id: "6", label: "Write tests" },
];

function SortableItem({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 text-sm",
        isDragging
          ? "z-10 border-primary shadow-lg shadow-primary/10"
          : "border-border hover:border-muted-foreground/30"
      )}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className="text-foreground">{item.label}</span>
    </li>
  );
}

export function SortableListProduction() {
  const [items, setItems] = useState(INITIAL);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIdx = prev.findIndex((i) => i.id === active.id);
        const newIdx = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((item) => (
              <SortableItem key={item.id} item={item} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Order: {items.map((i) => i.id).join(", ")}
        </p>
        <Button variant="link" size="sm" onClick={() => setItems(INITIAL)}>
          Reset
        </Button>
      </div>

      <Card size="sm">
        <CardFooter className="flex-col items-start gap-1">
          <p className="text-xs font-medium text-foreground">Libraries</p>
          <p className="text-xs text-muted-foreground">
            <strong>@dnd-kit</strong> — keyboard, touch, pointer sensors &bull;{" "}
            <strong>shadcn/ui</strong> — Button, Card
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
