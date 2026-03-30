"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════
// Helper: format bytes
// ═══════════════════════════════════════════
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ═══════════════════════════════════════════
// Demo 1: XHR Upload with Progress
// ═══════════════════════════════════════════
function XHRUploadDemo() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [speed, setSpeed] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const startTimeRef = useRef(0);

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  }

  function simulateUpload(file: File) {
    setStatus("uploading");
    setProgress(0);
    startTimeRef.current = Date.now();
    addLog(`Starting XHR upload: ${file.name} (${formatBytes(file.size)})`);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // ─── Upload progress ───
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);

        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const bps = e.loaded / elapsed;
        setSpeed(formatBytes(bps) + "/s");

        if (percent % 25 === 0 && percent > 0) {
          addLog(`Progress: ${percent}% — ${formatBytes(e.loaded)} / ${formatBytes(e.total)}`);
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("done");
        setProgress(100);
        addLog(`Upload complete! Status: ${xhr.status}`);
      } else {
        setStatus("error");
        addLog(`Upload failed: HTTP ${xhr.status} ${xhr.statusText}`);
      }
    };

    xhr.onerror = () => {
      setStatus("error");
      addLog("Network error occurred");
    };

    xhr.onabort = () => {
      setStatus("idle");
      addLog("Upload cancelled by user");
    };

    // Using httpbin to echo the upload (real app would use your API)
    xhr.open("POST", "https://httpbin.org/post");
    xhr.send(file);
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">
        1. XMLHttpRequest — Native Progress
      </h3>
      <p className="text-zinc-400 text-sm mb-3">
        XHR is the <strong>only native API</strong> with upload progress.
        Uses <code className="text-blue-400">xhr.upload.onprogress</code>.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) simulateUpload(file);
          }}
          className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer"
          disabled={status === "uploading"}
        />
        {status === "uploading" && (
          <button
            onClick={() => xhrRef.current?.abort()}
            className="px-3 py-1.5 bg-red-600 rounded text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      {status !== "idle" && (
        <div className="mb-3">
          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === "done"
                  ? "bg-green-500"
                  : status === "error"
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>{progress}%</span>
            <span>{speed}</span>
          </div>
        </div>
      )}

      {/* Log */}
      <div className="bg-zinc-900 rounded p-3 max-h-32 overflow-auto">
        {log.length === 0 ? (
          <span className="text-zinc-600 text-xs">Select a file to see XHR events...</span>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="text-xs font-mono text-green-400">
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Demo 2: Fetch API — No Upload Progress
// ═══════════════════════════════════════════
function FetchUploadDemo() {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [response, setResponse] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleUpload(file: File) {
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("uploading");
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // NOTE: NO progress tracking with fetch!
      const res = await fetch("https://httpbin.org/post", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setStatus("done");
      setResponse(JSON.stringify({ status: res.status, fileSize: file.size, headers: data.headers }, null, 2));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
      } else {
        setStatus("error");
        setResponse(err instanceof Error ? err.message : "Unknown error");
      }
    }
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">
        2. Fetch API — No Upload Progress
      </h3>
      <p className="text-zinc-400 text-sm mb-3">
        Fetch <strong>cannot</strong> track upload progress natively. You only get &quot;uploading&quot; or
        &quot;done&quot;. Use XHR or Axios when you need a progress bar.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
          className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer"
          disabled={status === "uploading"}
        />
        {status === "uploading" && (
          <button
            onClick={() => controllerRef.current?.abort()}
            className="px-3 py-1.5 bg-red-600 rounded text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {status === "uploading" && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 mb-3">
          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          Uploading... (no progress available with Fetch)
        </div>
      )}

      {response && (
        <pre className="bg-zinc-900 rounded p-3 text-xs font-mono text-green-400 max-h-32 overflow-auto">
          {response}
        </pre>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Demo 3: Drag-and-Drop Zone
// ═══════════════════════════════════════════
function DragDropDemo() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: number; type: string }[]>([]);
  const dragCounter = useRef(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(
      droppedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );
  }, []);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">3. Drag-and-Drop Zone</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Uses <code className="text-blue-400">onDragEnter/Over/Leave/Drop</code> events.
        Drag counter prevents flicker with nested elements.
      </p>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounter.current++;
          setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounter.current--;
          if (dragCounter.current === 0) setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
              : "border-zinc-700 hover:border-zinc-500"
          }
        `}
      >
        <div className="text-3xl mb-2">{isDragging ? "📂" : "📁"}</div>
        <p className="text-sm">
          {isDragging ? "Drop files here!" : "Drag files here"}
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-zinc-900 rounded px-3 py-2 text-sm"
            >
              <span className="truncate">{f.name}</span>
              <span className="text-zinc-500 text-xs ml-2 shrink-0">
                {formatBytes(f.size)} • {f.type || "unknown"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Demo 4: Image Preview Before Upload
// ═══════════════════════════════════════════
function ImagePreviewDemo() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; dimensions?: string } | null>(null);

  function handleFile(file: File) {
    setFileInfo({ name: file.name, size: file.size });

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setFileInfo((prev) =>
            prev ? { ...prev, dimensions: `${img.width}×${img.height}` } : null
          );
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">4. Image Preview (FileReader API)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Uses <code className="text-blue-400">FileReader.readAsDataURL()</code> to generate
        a preview before uploading. Also reads image dimensions.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="text-sm mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-500 file:cursor-pointer"
      />

      {preview && (
        <div className="flex gap-4 items-start">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-zinc-700"
          />
          <div className="text-sm">
            <div className="font-mono text-zinc-300">{fileInfo?.name}</div>
            <div className="text-zinc-500">{fileInfo ? formatBytes(fileInfo.size) : ""}</div>
            {fileInfo?.dimensions && (
              <div className="text-zinc-500">{fileInfo.dimensions}px</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Demo 5: Multi-File with Individual Progress
// ═══════════════════════════════════════════
interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
}

function MultiFileDemo() {
  const [items, setItems] = useState<UploadItem[]>([]);

  function addFiles(files: FileList) {
    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      progress: 0,
      status: "queued" as const,
    }));
    setItems((prev) => [...prev, ...newItems]);

    // Simulate uploading each file sequentially
    newItems.forEach((item, index) => {
      setTimeout(() => simulateProgress(item.id), index * 500);
    });
  }

  function simulateProgress(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "uploading" as const } : item
      )
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, progress: 100, status: "done" as const }
              : item
          )
        );
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, progress: Math.round(progress) } : item
          )
        );
      }
    }, 200);
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-1">5. Multi-File Upload Queue</h3>
      <p className="text-zinc-400 text-sm mb-3">
        Individual progress per file. In production, you&apos;d control concurrency
        (e.g., max 3 simultaneous uploads).
      </p>

      <input
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
        className="text-sm mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-orange-600 file:text-white hover:file:bg-orange-500 file:cursor-pointer"
      />

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-zinc-900 rounded p-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate">{item.name}</span>
                <span className="text-xs text-zinc-500 shrink-0 ml-2">
                  {formatBytes(item.size)}
                  {" • "}
                  <span
                    className={
                      item.status === "done"
                        ? "text-green-400"
                        : item.status === "uploading"
                        ? "text-blue-400"
                        : item.status === "error"
                        ? "text-red-400"
                        : "text-zinc-500"
                    }
                  >
                    {item.status}
                  </span>
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.status === "done" ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => setItems([])}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Demo 6: Comparison Table
// ═══════════════════════════════════════════
function ComparisonTable() {
  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold mb-3">XHR vs Fetch vs Axios</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-zinc-800">
              <th className="pb-2 text-zinc-400 font-medium">Feature</th>
              <th className="pb-2 text-zinc-400 font-medium">XHR</th>
              <th className="pb-2 text-zinc-400 font-medium">Fetch</th>
              <th className="pb-2 text-zinc-400 font-medium">Axios</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {[
              ["Upload progress", "✅ native", "❌ none", "✅ built-in"],
              ["Download progress", "✅ native", "✅ ReadableStream", "✅ built-in"],
              ["Cancel", "xhr.abort()", "AbortController", "AbortController"],
              ["Bundle size", "0 (native)", "0 (native)", "~13KB gzip"],
              ["Retry", "manual", "manual", "axios-retry"],
              ["Interceptors", "❌", "❌", "✅"],
              ["Streaming", "❌", "✅", "❌"],
            ].map(([feature, xhr, fetch, axios], i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="py-2 font-medium">{feature}</td>
                <td className="py-2 font-mono text-xs">{xhr}</td>
                <td className="py-2 font-mono text-xs">{fetch}</td>
                <td className="py-2 font-mono text-xs">{axios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-zinc-500">
        <strong className="text-zinc-400">Recommendation:</strong> Axios for most apps (progress + interceptors).
        XHR when zero-dependency needed. Fetch for simple uploads without progress.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════
export default function FileUploadPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 text-sm hover:underline mb-4 block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold mb-2 font-mono">File Upload Practice</h1>
      <p className="text-zinc-400 mb-8">
        Interactive examples of upload progress tracking, drag-and-drop, image preview,
        and multi-file queues. Pick real files to test.
      </p>
      <div className="grid gap-6">
        <XHRUploadDemo />
        <FetchUploadDemo />
        <DragDropDemo />
        <ImagePreviewDemo />
        <MultiFileDemo />
        <ComparisonTable />
      </div>
    </main>
  );
}
