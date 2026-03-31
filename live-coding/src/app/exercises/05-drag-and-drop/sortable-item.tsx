"use client";

type Props = {
  label: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: () => void;
  isDragging: boolean;
};

export function SortableItem({
  label,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: Props) {
  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={onDrop}
      className={`cursor-grab rounded-lg border p-4 transition-all active:cursor-grabbing ${
        isDragging
          ? "border-blue-500 bg-blue-500/10 opacity-50"
          : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
      }`}
    >
      <span className="mr-3 text-zinc-500">⠿</span>
      {label}
    </li>
  );
}
