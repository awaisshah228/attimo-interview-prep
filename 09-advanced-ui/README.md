# Advanced UI Patterns

## What This Covers
Complex UI patterns that Attimo explicitly calls out: virtualisation, drag-and-drop, rich text editing, file upload flows, dashboards, and timelines.

---

## 1. Virtualisation

**Problem**: Rendering 10,000+ rows in a table or list creates 10,000+ DOM nodes → browser freezes.

**Solution**: Only render the visible rows + a small buffer. As the user scrolls, swap DOM nodes.

### Libraries
- **TanStack Virtual** (recommended) — headless, works with any UI
- **react-window** — lightweight, stable
- **react-virtuoso** — more features out of the box

### How It Works

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,       // Total items
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,    // Estimated row height in px
    overscan: 5,               // Render 5 extra rows above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### TanStack Table + Virtual (Data Tables)

```tsx
// TanStack Table for column definitions, sorting, filtering
// TanStack Virtual for rendering only visible rows
// Combine both for high-performance data tables
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
```

---

## 2. Drag-and-Drop

### Libraries
- **dnd-kit** (recommended) — modern, accessible, performant
- **@hello-pangea/dnd** — fork of react-beautiful-dnd, simpler API
- **Pragmatic Drag and Drop** — Atlassian's library

### dnd-kit Example

```tsx
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function SortableList({ items, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      onReorder(active.id, over.id);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} id={item.id}>
            {item.name}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Use Cases
- Kanban boards (column-to-column drag)
- Reorderable lists (task priority)
- File organization
- Dashboard widget arrangement

---

## 3. Rich Text Editing

### Libraries
- **Tiptap** (recommended) — built on ProseMirror, great DX
- **Slate.js** — lower-level, more control
- **ProseMirror** — powerful but complex

### Tiptap Example

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start typing...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;
  return (
    <div className="flex gap-1 border-b p-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200' : ''}
      >
        Bold
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}>
        Italic
      </button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
        List
      </button>
    </div>
  );
}
```

---

## 4. File Upload Flows

### Signed URL Pattern (Secure, Scalable)

```
Client → Server: "I want to upload photo.jpg (2MB, image/jpeg)"
Server → Storage: "Generate a pre-signed PUT URL"
Storage → Server: "Here's a URL valid for 5 minutes"
Server → Client: "Upload directly to this URL"
Client → Storage: "PUT file directly (with progress tracking)"
Client → Server: "Upload complete, here's the file key"
```

### Implementation

```tsx
// Server: generate signed URL
async function POST(request: Request) {
  const { filename, contentType } = await request.json();

  // Validate file type and size
  if (!ALLOWED_TYPES.includes(contentType)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const signedUrl = await storage.createPresignedUrl({
    key: `uploads/${crypto.randomUUID()}/${filename}`,
    contentType,
    expiresIn: 300, // 5 minutes
  });

  return Response.json({ url: signedUrl.url, key: signedUrl.key });
}

// Client: upload with progress
function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  async function upload(file: File) {
    setStatus('uploading');

    // 1. Get signed URL from your server
    const { url, key } = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    }).then(r => r.json());

    // 2. Upload directly to storage with progress
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => setProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => (xhr.status === 200 ? resolve(xhr) : reject(xhr));
      xhr.onerror = reject;
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    setStatus('done');
    return key;
  }

  return { upload, progress, status };
}
```

### Drag-and-Drop File Zone

```tsx
function DropZone({ onFiles }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      )}
    >
      <p>Drag files here or <label className="text-blue-500 cursor-pointer">browse<input type="file" className="hidden" onChange={e => onFiles(Array.from(e.target.files))} multiple /></label></p>
    </div>
  );
}
```

---

## 5. Dashboards

### Layout Patterns

```tsx
// Responsive grid dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="Revenue" value="$12,345" change="+12%" />
  <StatCard title="Users" value="1,234" change="+5%" />
  <StatCard title="Orders" value="567" change="-3%" />
  <StatCard title="Conversion" value="3.2%" change="+0.5%" />
</div>

{/* Full-width chart */}
<Card className="col-span-full">
  <LineChart data={revenueData} />
</Card>

{/* Two-column layout */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <Card><RecentOrders /></Card>
  <Card><TopProducts /></Card>
</div>
```

### Chart Libraries
- **Recharts** — declarative, built on D3, most popular for React
- **Visx** — low-level D3 + React primitives
- **Chart.js** via react-chartjs-2

---

## 6. Timelines

### Vertical Timeline Pattern

```tsx
function Timeline({ events }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {events.map((event, i) => (
        <div key={i} className="relative flex gap-4 pb-8">
          {/* Dot */}
          <div className="relative z-10 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <EventIcon type={event.type} />
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-gray-500">{event.date}</p>
            <p className="mt-1 text-gray-700">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Key Terms

- **Virtualisation**: Rendering only visible items in large lists/tables
- **Overscan**: Extra items rendered above/below the viewport as a buffer
- **dnd-kit**: Modern drag-and-drop library for React
- **ProseMirror**: Low-level rich text editing framework
- **Tiptap**: Developer-friendly wrapper around ProseMirror
- **Signed URL**: Time-limited, pre-authenticated URL for direct storage upload
- **Progress tracking**: XHR `upload.onprogress` for upload percentage
- **Recharts**: Declarative chart library built on D3
