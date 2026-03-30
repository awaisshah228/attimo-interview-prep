# File Ingestion & Upload Systems

## What It Is
Handling file uploads securely and reliably: validation, progress tracking, signed URLs for direct-to-storage uploads, and error recovery. Covers Fetch API, XMLHttpRequest, Axios, React hooks, Next.js API routes, and Express.js middleware.

---

## Table of Contents
1. [Signed URL Pattern](#signed-url-pattern)
2. [Progress Tracking — 3 Approaches](#progress-tracking--3-approaches)
3. [React Upload Hook (Reusable)](#react-upload-hook-reusable)
4. [Next.js Server (App Router)](#nextjs-server-app-router)
5. [Express.js Server](#expressjs-server)
6. [Drag-and-Drop Zone](#drag-and-drop-zone)
7. [Multi-File Upload with Queue](#multi-file-upload-with-queue)
8. [Chunked/Resumable Upload](#chunkedresumable-upload)
9. [Server-Side Validation (Magic Bytes)](#server-side-validation-magic-bytes)
10. [Error Recovery & Retry](#error-recovery--retry)
11. [Image Preview Before Upload](#image-preview-before-upload)
12. [Key Terms](#key-terms)
13. [Common Interview Questions](#common-interview-questions)

---

## Signed URL Pattern

The standard approach for production file uploads. Client uploads directly to storage (S3, Vercel Blob, etc.), bypassing your server.

```
┌──────────┐    1. Request upload URL     ┌──────────┐
│  Client   │ ──────────────────────────→ │  Server   │
│ (Browser) │                              │ (API)     │
│           │ ←────────────────────────── │           │
│           │    2. Signed URL + key       │           │
│           │                              └──────────┘
│           │    3. PUT file directly       ┌──────────┐
│           │ ──────────────────────────→  │ Storage   │
│           │                              │ (S3/Blob) │
│           │ ←────────────────────────── │           │
│           │    4. 200 OK                 └──────────┘
│           │                              ┌──────────┐
│           │    5. Confirm upload          │  Server   │
│           │ ──────────────────────────→  │ (API)     │
└──────────┘                              └──────────┘
```

**Why not upload through your server?**
- Server doesn't handle the file bytes → saves bandwidth/CPU/memory
- Client uploads directly to S3/Blob at full speed
- Server only validates and generates URLs
- Scales to thousands of concurrent uploads

---

## Progress Tracking — 3 Approaches

### 1. XMLHttpRequest (XHR) — Native, Full Control

XHR is the **only native browser API** that supports upload progress tracking.

```tsx
function uploadWithXHR(file: File, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // ─── Upload progress (client → server) ───
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        console.log(`Upload: ${percent}% (${event.loaded}/${event.total} bytes)`);
      }
    };

    // ─── Download progress (server → client, e.g., response body) ───
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        console.log(`Download: ${Math.round((event.loaded / event.total) * 100)}%`);
      }
    };

    // ─── Completion handlers ───
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    // ─── Configure and send ───
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.timeout = 300000; // 5 minutes
    xhr.send(file);
  });
}
```

### 2. Fetch API — No Native Progress, But Workarounds

**Fetch does NOT support upload progress natively.** But you can:
- Track **download** progress via `response.body` (ReadableStream)
- For **upload** progress with Fetch, you must use the file size + server-sent events

```tsx
// ─── Fetch: Upload (no progress) + download progress ───
async function uploadWithFetch(file: File, url: string) {
  // Upload the file — NO progress events available
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return response;
}

// ─── Fetch: Upload through your server with FormData ───
async function uploadViaServer(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ description: 'Profile photo' }));

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData, // Do NOT set Content-Type — browser sets it with boundary
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

// ─── Fetch: Track download progress (useful for large responses) ───
async function fetchWithProgress(url: string, onProgress: (percent: number) => void) {
  const response = await fetch(url);
  const contentLength = Number(response.headers.get('Content-Length'));

  if (!response.body || !contentLength) {
    return response.json(); // Can't track without body/length
  }

  const reader = response.body.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    received += value.length;
    onProgress(Math.round((received / contentLength) * 100));
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }

  return JSON.parse(new TextDecoder().decode(body));
}
```

### 3. Axios — Easiest Progress Tracking

Axios has **built-in upload AND download progress** via `onUploadProgress` and `onDownloadProgress`.

```bash
npm install axios
```

```tsx
import axios, { AxiosProgressEvent } from 'axios';

// ─── Simple upload with progress ───
async function uploadWithAxios(file: File, url: string, onProgress: (percent: number) => void) {
  const response = await axios.put(url, file, {
    headers: { 'Content-Type': file.type },

    // Upload progress — fires frequently during upload
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (event.total) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    },

    // Download progress — for tracking response download
    onDownloadProgress: (event: AxiosProgressEvent) => {
      console.log('Download progress:', event.loaded);
    },

    // Timeout
    timeout: 300000, // 5 minutes

    // Cancel support
    signal: AbortSignal.timeout(300000),
  });

  return response.data;
}

// ─── Upload via server with FormData ───
async function uploadFormDataAxios(
  file: File,
  onProgress: (percent: number) => void
) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return response.data;
}

// ─── Cancel upload ───
const controller = new AbortController();

axios.put(url, file, {
  signal: controller.signal,
  onUploadProgress: (e) => console.log(e.loaded),
});

// Cancel it
controller.abort();
```

### Comparison Table

| Feature | XHR | Fetch | Axios |
|---------|-----|-------|-------|
| Upload progress | `xhr.upload.onprogress` | Not supported | `onUploadProgress` |
| Download progress | `xhr.onprogress` | `response.body.getReader()` | `onDownloadProgress` |
| Cancel upload | `xhr.abort()` | `AbortController` | `AbortController` |
| FormData | Yes | Yes | Yes (auto Content-Type) |
| Streaming upload | No | Yes (Request body) | No |
| Browser support | All | All modern | All (library) |
| Bundle size | 0 (native) | 0 (native) | ~13KB gzipped |
| Error handling | Manual | Manual | Interceptors |
| Retry | Manual | Manual | axios-retry plugin |

**Recommendation:**
- **Axios** for most projects — easiest progress tracking, interceptors, good DX
- **XHR** when you can't add dependencies — only native option with upload progress
- **Fetch** when you don't need upload progress — simpler API, streaming support

---

## React Upload Hook (Reusable)

### With Axios

```tsx
import { useState, useRef, useCallback } from 'react';
import axios, { CancelTokenSource } from 'axios';

interface UploadState {
  status: 'idle' | 'uploading' | 'done' | 'error' | 'cancelled';
  progress: number;
  speed: string;        // e.g., "2.5 MB/s"
  timeRemaining: string; // e.g., "12s"
  error: string | null;
  url: string | null;
}

function useFileUpload(endpoint = '/api/upload') {
  const [state, setState] = useState<UploadState>({
    status: 'idle', progress: 0, speed: '', timeRemaining: '', error: null, url: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef(0);

  const upload = useCallback(async (file: File) => {
    const controller = new AbortController();
    abortRef.current = controller;
    startTimeRef.current = Date.now();

    setState({ status: 'uploading', progress: 0, speed: '', timeRemaining: '', error: null, url: null });

    try {
      // 1. Get signed URL from server
      const { data: { uploadUrl, fileUrl } } = await axios.post(endpoint, {
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }, { signal: controller.signal });

      // 2. Upload directly to storage with progress
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        signal: controller.signal,
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const bytesPerSec = event.loaded / elapsed;
          const remaining = (event.total - event.loaded) / bytesPerSec;

          setState(s => ({
            ...s,
            progress: percent,
            speed: formatBytes(bytesPerSec) + '/s',
            timeRemaining: remaining < 1 ? 'Almost done' : `${Math.ceil(remaining)}s`,
          }));
        },
      });

      setState(s => ({ ...s, status: 'done', progress: 100, url: fileUrl }));
      return fileUrl;
    } catch (err: any) {
      if (axios.isCancel(err)) {
        setState(s => ({ ...s, status: 'cancelled', error: 'Upload cancelled' }));
      } else {
        setState(s => ({ ...s, status: 'error', error: err.message || 'Upload failed' }));
      }
      throw err;
    }
  }, [endpoint]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, speed: '', timeRemaining: '', error: null, url: null });
  }, []);

  return { ...state, upload, cancel, reset };
}

// Helper
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
```

### With XHR (No Dependencies)

```tsx
function useFileUploadXHR() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  async function upload(file: File) {
    setStatus('uploading');
    setProgress(0);
    setError(null);

    // 1. Get signed URL
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
    });
    const { uploadUrl, fileUrl } = await res.json();

    // 2. Upload with XHR for progress
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus('done');
          setProgress(100);
          resolve(fileUrl);
        } else {
          setStatus('error');
          setError(`HTTP ${xhr.status}`);
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => { setStatus('error'); setError('Network error'); reject(new Error('Network error')); };
      xhr.onabort = () => { setStatus('idle'); reject(new Error('Cancelled')); };

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  function cancel() { xhrRef.current?.abort(); }
  function reset() { setProgress(0); setStatus('idle'); setError(null); }

  return { progress, status, error, upload, cancel, reset };
}
```

### Upload UI Component

```tsx
function FileUploader() {
  const { status, progress, speed, timeRemaining, error, url, upload, cancel, reset } = useFileUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    // Client-side validation
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large (max 50MB)');
      return;
    }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      alert('Invalid file type');
      return;
    }
    await upload(file);
  }

  return (
    <div>
      {/* File input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {status === 'idle' && (
        <button onClick={() => inputRef.current?.click()}>
          Choose File
        </button>
      )}

      {status === 'uploading' && (
        <div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>{progress}%</span>
            <span>{speed} — {timeRemaining}</span>
          </div>
          <button onClick={cancel}>Cancel</button>
        </div>
      )}

      {status === 'done' && (
        <div>
          <p>Upload complete!</p>
          <a href={url!} target="_blank">View file</a>
          <button onClick={reset}>Upload another</button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p className="text-red-500">{error}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    </div>
  );
}
```

---

## Next.js Server (App Router)

### Route Handler — Signed URL Approach

```tsx
// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  const { filename, contentType, size } = await request.json();

  // Validate
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: `File too large (max ${MAX_SIZE / 1024 / 1024}MB)` }, { status: 400 });
  }

  // Generate blob upload URL
  const blob = await put(filename, new Uint8Array(0), {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  });

  return NextResponse.json({ uploadUrl: blob.url, fileUrl: blob.url });
}
```

### Route Handler — Direct Upload (Server Receives File)

```tsx
// app/api/upload/direct/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  // Read file into buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  const ext = path.extname(file.name);
  const uniqueName = `${crypto.randomUUID()}${ext}`;

  // Save to disk (or S3, or wherever)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, uniqueName), buffer);

  return NextResponse.json({
    url: `/uploads/${uniqueName}`,
    size: file.size,
    name: file.name,
  });
}

// IMPORTANT: Increase body size limit for file uploads
export const config = {
  api: { bodyParser: false }, // Only needed in Pages Router
};
```

### Server Action — Upload with Form

```tsx
// app/actions/upload.ts
'use server';

import { put } from '@vercel/blob';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) throw new Error('No file');

  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return { url: blob.url };
}
```

```tsx
// app/upload/page.tsx
'use client';

import { uploadFile } from '../actions/upload';
import { useActionState } from 'react';

export default function UploadPage() {
  const [state, action, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return await uploadFile(formData);
    },
    null
  );

  return (
    <form action={action}>
      <input type="file" name="file" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Uploading...' : 'Upload'}
      </button>
      {state?.url && <img src={state.url} alt="Uploaded" width={200} />}
    </form>
  );
}
```

---

## Express.js Server

### Multer (Standard File Upload Middleware)

```bash
npm install express multer @types/multer
```

```tsx
// server.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const app = express();

// ─── Configure multer storage ───
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ─── File filter (validation) ───
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10,                    // Max 10 files per request
  },
});

// ─── Single file upload ───
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// ─── Multiple file upload ───
app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
  const files = req.files as Express.Multer.File[];
  res.json({
    files: files.map(f => ({
      url: `/uploads/${f.filename}`,
      originalName: f.originalname,
      size: f.size,
    })),
  });
});

// ─── Mixed fields (file + text data) ───
app.post('/api/upload/profile',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    res.json({
      avatar: files.avatar?.[0]?.filename,
      documents: files.documents?.map(f => f.filename),
      name: req.body.name, // Text fields from FormData
    });
  }
);

// ─── Error handling ───
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.includes('not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.listen(3001, () => console.log('Server on :3001'));
```

### S3 Signed URL with Express

```tsx
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

app.post('/api/upload/signed-url', express.json(), async (req, res) => {
  const { filename, contentType, size } = req.body;

  // Validate
  if (size > 50 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large' });
  }

  const key = `uploads/${crypto.randomUUID()}/${filename}`;

  // Generate presigned URL (valid 5 minutes)
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  res.json({
    uploadUrl,
    fileUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
    key,
  });
});
```

### Upload Progress with Express (SSE)

Server-Sent Events to push upload progress from server to client:

```tsx
// Express: track processing progress after upload
app.post('/api/upload/process', upload.single('file'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Step 1: File received
  res.write(`data: ${JSON.stringify({ step: 'received', progress: 25 })}\n\n`);

  // Step 2: Validate
  await validateFile(req.file);
  res.write(`data: ${JSON.stringify({ step: 'validated', progress: 50 })}\n\n`);

  // Step 3: Process (resize, convert, etc.)
  const result = await processFile(req.file);
  res.write(`data: ${JSON.stringify({ step: 'processed', progress: 75 })}\n\n`);

  // Step 4: Store
  const url = await storeFile(result);
  res.write(`data: ${JSON.stringify({ step: 'done', progress: 100, url })}\n\n`);

  res.end();
});
```

---

## Drag-and-Drop Zone

```tsx
'use client';

import { useState, useRef, useCallback } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;
}

function DropZone({ onFiles, accept, maxSize = 10 * 1024 * 1024, maxFiles = 10 }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0); // Track nested drag events

  const validateFiles = useCallback((files: File[]): File[] => {
    return files.filter(file => {
      if (accept && !accept.includes(file.type)) {
        console.warn(`Rejected ${file.name}: invalid type ${file.type}`);
        return false;
      }
      if (file.size > maxSize) {
        console.warn(`Rejected ${file.name}: too large (${file.size} > ${maxSize})`);
        return false;
      }
      return true;
    }).slice(0, maxFiles);
  }, [accept, maxSize, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const valid = validateFiles(files);
    if (valid.length > 0) onFiles(valid);
  }, [onFiles, validateFiles]);

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300 hover:border-gray-400'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={maxFiles > 1}
        accept={accept?.join(',')}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          const valid = validateFiles(files);
          if (valid.length > 0) onFiles(valid);
          e.target.value = ''; // Reset so same file can be selected again
        }}
      />
      <p>{isDragging ? 'Drop files here' : 'Drag files here or click to browse'}</p>
      <p className="text-sm text-gray-500 mt-1">
        Max {maxFiles} files, {maxSize / 1024 / 1024}MB each
      </p>
    </div>
  );
}
```

---

## Multi-File Upload with Queue

Upload multiple files with individual progress, retries, and concurrency control.

```tsx
interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  url: string | null;
  error: string | null;
}

function useMultiFileUpload(concurrency = 3) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);

  function addFiles(newFiles: File[]) {
    const items: FileUploadItem[] = newFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'queued',
      url: null,
      error: null,
    }));
    setFiles(prev => [...prev, ...items]);
    processQueue(items);
  }

  async function processQueue(items: FileUploadItem[]) {
    // Process up to `concurrency` files at a time
    const queue = [...items];
    const active: Promise<void>[] = [];

    while (queue.length > 0 || active.length > 0) {
      while (active.length < concurrency && queue.length > 0) {
        const item = queue.shift()!;
        const promise = uploadOne(item).then(() => {
          active.splice(active.indexOf(promise), 1);
        });
        active.push(promise);
      }
      if (active.length > 0) await Promise.race(active);
    }
  }

  async function uploadOne(item: FileUploadItem) {
    updateItem(item.id, { status: 'uploading' });

    try {
      const formData = new FormData();
      formData.append('file', item.file);

      await axios.post('/api/upload', formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            updateItem(item.id, { progress: Math.round((e.loaded / e.total) * 100) });
          }
        },
      });

      updateItem(item.id, { status: 'done', progress: 100 });
    } catch (err: any) {
      updateItem(item.id, { status: 'error', error: err.message });
    }
  }

  function updateItem(id: string, updates: Partial<FileUploadItem>) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  return { files, addFiles, removeFile };
}
```

---

## Chunked/Resumable Upload

For files >100MB, upload in chunks for resumability.

```tsx
async function chunkedUpload(
  file: File,
  onProgress: (percent: number) => void,
  chunkSize = 5 * 1024 * 1024 // 5MB chunks
) {
  const totalChunks = Math.ceil(file.size / chunkSize);

  // 1. Initiate multipart upload
  const { uploadId } = await axios.post('/api/upload/initiate', {
    filename: file.name,
    contentType: file.type,
    totalChunks,
  }).then(r => r.data);

  // 2. Upload each chunk
  const parts: { partNumber: number; etag: string }[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // Retry each chunk up to 3 times
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data } = await axios.put(
          `/api/upload/chunk/${uploadId}/${i}`,
          chunk,
          { headers: { 'Content-Type': 'application/octet-stream' } }
        );
        parts.push({ partNumber: i + 1, etag: data.etag });
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }

    onProgress(Math.round(((i + 1) / totalChunks) * 100));
  }

  // 3. Complete multipart upload
  const { data } = await axios.post('/api/upload/complete', { uploadId, parts });
  return data.url;
}
```

---

## Server-Side Validation (Magic Bytes)

Don't trust the client's Content-Type. Check the actual file bytes.

```tsx
// Magic bytes for common file types
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function detectFileType(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (signature.every((byte, i) => buffer[i] === byte)) {
        return mimeType;
      }
    }
  }
  return null;
}

// Usage in Express
app.post('/api/upload', upload.single('file'), (req, res) => {
  const buffer = require('fs').readFileSync(req.file!.path);
  const detectedType = detectFileType(buffer);

  if (!detectedType) {
    require('fs').unlinkSync(req.file!.path); // Delete suspicious file
    return res.status(400).json({ error: 'Unknown or invalid file type' });
  }

  if (detectedType !== req.file!.mimetype) {
    require('fs').unlinkSync(req.file!.path);
    return res.status(400).json({
      error: `File type mismatch: claimed ${req.file!.mimetype} but detected ${detectedType}`,
    });
  }

  res.json({ url: `/uploads/${req.file!.filename}`, type: detectedType });
});
```

---

## Error Recovery & Retry

```tsx
async function uploadWithRetry(file: File, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await upload(file);
    } catch (error: any) {
      // Don't retry client errors (400) — they'll fail again
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff with jitter: 1-2s, 2-4s, 4-8s
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`Retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

| Error Type | HTTP Code | Retry? | Action |
|-----------|-----------|--------|--------|
| Invalid file type | 400 | No | Show error, let user pick another file |
| File too large | 400 | No | Show error with size limit |
| Unauthorized | 401 | No | Redirect to login |
| Signed URL expired | 403 | Yes | Get new URL, retry |
| Rate limited | 429 | Yes | Wait for Retry-After header |
| Server error | 500 | Yes | Exponential backoff |
| Network error | – | Yes | Exponential backoff |
| Timeout | – | Yes | Exponential backoff |

---

## Image Preview Before Upload

```tsx
function useImagePreview() {
  const [preview, setPreview] = useState<string | null>(null);

  function generatePreview(file: File) {
    if (!file.type.startsWith('image/')) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  return { preview, generatePreview, clearPreview };
}

// Usage
function AvatarUpload() {
  const { preview, generatePreview } = useImagePreview();
  const { upload, progress, status } = useFileUpload();

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            generatePreview(file);
            upload(file);
          }
        }}
      />
      {preview && (
        <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-full" />
      )}
      {status === 'uploading' && <div>Uploading: {progress}%</div>}
    </div>
  );
}
```

---

## Key Terms

- **Signed URL / Presigned URL**: Time-limited, pre-authenticated URL for direct storage upload
- **FormData**: Web API for sending files + text fields in a single request
- **Multer**: Express.js middleware for handling multipart/form-data (file uploads)
- **XMLHttpRequest (XHR)**: Only native browser API with upload progress tracking
- **Axios**: HTTP library with built-in progress callbacks (`onUploadProgress`)
- **Fetch API**: Modern HTTP API — no upload progress, but supports streaming
- **AbortController**: Cancel ongoing fetch/axios/XHR requests
- **Chunked upload**: Splitting large files into pieces for resumability
- **Multipart upload**: S3/storage protocol for chunked uploads
- **Content-Type validation**: Verify MIME type server-side
- **Magic bytes**: First bytes of a file that identify its true format (don't trust client type)
- **Exponential backoff**: Retry with increasing delay (1s, 2s, 4s)
- **Jitter**: Random delay added to prevent thundering herd on retries
- **Concurrency control**: Limit how many files upload simultaneously
- **SSE (Server-Sent Events)**: Push progress from server to client for post-upload processing
- **Drag counter**: Track nested drag enter/leave events to prevent flicker

---

## Common Interview Questions

1. **Why use signed URLs instead of uploading through your server?**
   - Saves server bandwidth/CPU, faster (direct to storage), scales better. Server only handles validation and URL generation.

2. **How do you track upload progress?**
   - **Axios**: `onUploadProgress` callback. **XHR**: `xhr.upload.onprogress` event. **Fetch**: No native upload progress — use XHR/Axios, or track post-upload processing via SSE.

3. **Fetch vs Axios vs XHR for file uploads?**
   - Axios: best DX, built-in progress. XHR: no dependencies, full progress. Fetch: no upload progress, but clean API for simple uploads.

4. **How do you validate file uploads?**
   - Client-side: type/size checks (UX only). Server-side: check magic bytes (first bytes of file), validate MIME type, scan for malware, enforce size limits.

5. **How do you handle large file uploads?**
   - Chunked/multipart upload (5MB chunks), resumability from last completed chunk, per-chunk retry, progress tracking per chunk.

6. **How do you handle upload failures?**
   - Retry 5xx/network errors with exponential backoff + jitter. Don't retry 4xx (validation errors). For chunked uploads, resume from last successful chunk.

7. **How do you implement drag-and-drop upload?**
   - `onDragEnter`/`onDragOver`/`onDragLeave`/`onDrop` events. Use a drag counter for nested elements. Validate files in `onDrop`. Show visual feedback while dragging.

8. **How do you upload multiple files?**
   - Queue with concurrency control (e.g., 3 concurrent uploads). Individual progress per file. Retry failed files independently. Use `FormData.append()` for multi-file server uploads.

9. **How do you handle file uploads in Next.js?**
   - **Signed URL approach**: Route Handler generates presigned URL → client uploads to S3/Blob directly. **Direct upload**: Route Handler receives FormData. **Server Action**: For form-based uploads with progressive enhancement.

10. **How do you prevent malicious file uploads?**
    - Validate magic bytes (not just extension/MIME), scan with antivirus, store outside webroot, randomize filenames, set Content-Disposition headers, use a CDN with security features.
