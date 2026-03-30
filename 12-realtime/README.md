# Real-time Sync (WebSocket, SSE & Socket.IO)

## What It Is
Real-time communication allows the server to push updates to clients instantly, without the client polling repeatedly. Three main approaches: raw WebSocket, Server-Sent Events (SSE), and Socket.IO.

---

## WebSocket vs SSE vs Socket.IO

| Feature | WebSocket (raw) | SSE | Socket.IO |
|---------|----------------|-----|-----------|
| **Direction** | Bidirectional | Server → client only | Bidirectional |
| **Protocol** | `ws://` / `wss://` | Regular HTTP | WebSocket + HTTP fallback |
| **Reconnection** | Manual | Built-in | Built-in + exponential backoff |
| **Binary data** | Yes | No (text only) | Yes |
| **Rooms/namespaces** | Manual | No | Built-in |
| **Acknowledgements** | Manual | No | Built-in (callback) |
| **Fallback** | None (fails if WS blocked) | N/A | Long-polling → WebSocket |
| **Browser support** | All modern | All modern | All (uses fallbacks) |
| **Bundle size** | 0 (native) | 0 (native) | ~45KB (client library) |
| **Best for** | Simple bidirectional, low overhead | Server push, AI streaming | Chat, collaboration, rooms |
| **Complexity** | Medium | Low | Low (high-level API) |

---

## Raw WebSocket

### How It Works
1. Client sends HTTP upgrade request
2. Server accepts → persistent TCP connection established
3. Both sides can send messages at any time
4. Connection stays open until explicitly closed

### Server (Node.js with `ws`)

```tsx
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  ws.on('close', () => console.log('Client disconnected'));
});
```

### Client (React Hook)

```tsx
function useWebSocket(url: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');
    ws.onclose = () => {
      setStatus('disconnected');
      // Reconnect after 3 seconds
      setTimeout(() => {
        wsRef.current = new WebSocket(url);
      }, 3000);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => ws.close();
  }, [url]);

  const send = useCallback((data: any) => {
    wsRef.current?.send(JSON.stringify(data));
  }, []);

  return { messages, send, status };
}
```

---

## Server-Sent Events (SSE)

### How It Works
1. Client opens a regular HTTP connection
2. Server keeps the connection open, sends events as text
3. Client receives events via `EventSource` API
4. Auto-reconnects if connection drops

### Server (Next.js Route Handler)

```tsx
// app/api/events/route.ts
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const data = JSON.stringify({
          time: new Date().toISOString(),
          value: Math.random(),
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }, 1000);

      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client

```tsx
function useSSE(url: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const source = new EventSource(url);

    source.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    source.onerror = () => {
      // EventSource auto-reconnects
      console.log('SSE connection error, reconnecting...');
    };

    return () => source.close();
  }, [url]);

  return data;
}
```

### Named Events

```tsx
// Server
controller.enqueue(encoder.encode(`event: notification\ndata: ${data}\n\n`));
controller.enqueue(encoder.encode(`event: update\ndata: ${data}\n\n`));

// Client
source.addEventListener('notification', (event) => {
  console.log('Notification:', JSON.parse(event.data));
});
source.addEventListener('update', (event) => {
  console.log('Update:', JSON.parse(event.data));
});
```

---

## Socket.IO

### What It Is
Socket.IO is a library built **on top of** WebSocket that adds:
- **Automatic reconnection** with exponential backoff
- **Rooms** (broadcast to groups of clients)
- **Namespaces** (separate communication channels)
- **Acknowledgements** (confirm message received)
- **Fallback** to HTTP long-polling when WebSocket is blocked
- **Binary support** (images, files)
- **Middleware** (auth, logging)

It is NOT just a WebSocket wrapper — it has its own protocol. A Socket.IO client **cannot** connect to a raw WebSocket server and vice versa.

```bash
npm install socket.io          # Server
npm install socket.io-client   # Client
```

---

### Express.js + Socket.IO Server (Full Example)

```tsx
// server.ts
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000', // Your Next.js/React app
    methods: ['GET', 'POST'],
  },
  // Connection options
  pingTimeout: 60000,      // How long to wait for pong before disconnect
  pingInterval: 25000,     // How often to ping clients
});

// ─── Types ───
interface User {
  id: string;
  name: string;
  room: string;
}

const users = new Map<string, User>();

// ─── Middleware (auth) ───
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  // Verify token (JWT, session, etc.)
  try {
    const user = verifyToken(token); // Your auth function
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// ─── Connection handler ───
io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // ─── Join a room ───
  socket.on('join-room', (roomName: string, callback) => {
    socket.join(roomName);
    users.set(socket.id, {
      id: socket.id,
      name: socket.data.user?.name || 'Anonymous',
      room: roomName,
    });

    // Notify others in the room
    socket.to(roomName).emit('user-joined', {
      userId: socket.id,
      name: socket.data.user?.name,
    });

    // Send room info back to the joiner
    const roomUsers = Array.from(users.values()).filter(u => u.room === roomName);
    callback({ success: true, users: roomUsers }); // Acknowledgement!
  });

  // ─── Chat message ───
  socket.on('message', (data: { room: string; text: string }, callback) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now().toString(),
      userId: socket.id,
      userName: user.name,
      text: data.text,
      timestamp: new Date().toISOString(),
    };

    // Send to everyone in the room (including sender)
    io.to(data.room).emit('message', message);

    // Acknowledge receipt
    callback({ delivered: true, messageId: message.id });
  });

  // ─── Typing indicator ───
  socket.on('typing', (room: string) => {
    const user = users.get(socket.id);
    socket.to(room).emit('user-typing', {
      userId: socket.id,
      name: user?.name,
    });
  });

  socket.on('stop-typing', (room: string) => {
    socket.to(room).emit('user-stop-typing', { userId: socket.id });
  });

  // ─── Leave room ───
  socket.on('leave-room', (roomName: string) => {
    socket.leave(roomName);
    users.delete(socket.id);
    socket.to(roomName).emit('user-left', { userId: socket.id });
  });

  // ─── Disconnect ───
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    const user = users.get(socket.id);
    if (user) {
      socket.to(user.room).emit('user-left', { userId: socket.id });
      users.delete(socket.id);
    }
  });
});

// ─── REST endpoint can also emit ───
app.post('/api/notify', express.json(), (req, res) => {
  const { room, event, data } = req.body;
  io.to(room).emit(event, data); // Emit from REST handler!
  res.json({ sent: true });
});

httpServer.listen(3001, () => console.log('Server on :3001'));
```

---

### Socket.IO Emit Patterns (Server)

```tsx
// To ONE specific client
io.to(socketId).emit('private-message', data);

// To ALL clients (including sender)
io.emit('global-announcement', data);

// To all in a room EXCEPT sender
socket.to('room-1').emit('new-message', data);

// To all in a room INCLUDING sender
io.to('room-1').emit('new-message', data);

// To ALL EXCEPT sender (broadcast)
socket.broadcast.emit('user-joined', data);

// To multiple rooms
io.to('room-1').to('room-2').emit('shared-event', data);

// With acknowledgement (server waits for client response)
io.to(socketId).emit('request', data, (response) => {
  console.log('Client acknowledged:', response);
});
```

---

### React Client — useSocket Hook

```tsx
// hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url: string;
  token?: string;
  autoConnect?: boolean;
}

export function useSocket({ url, token, autoConnect = true }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<string>('');

  useEffect(() => {
    const socket = io(url, {
      auth: { token },
      autoConnect,
      reconnection: true,           // Auto-reconnect (default: true)
      reconnectionAttempts: 10,      // Max attempts
      reconnectionDelay: 1000,       // Start with 1s
      reconnectionDelayMax: 30000,   // Max 30s between retries
      timeout: 20000,                // Connection timeout
      transports: ['websocket', 'polling'], // Try WebSocket first
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      console.log('Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Disconnected:', reason);
      // reason: 'io server disconnect' | 'io client disconnect' |
      //         'ping timeout' | 'transport close' | 'transport error'
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      // If auth fails, don't keep retrying
      if (error.message === 'Authentication required') {
        socket.disconnect();
      }
    });

    socket.io.engine.on('upgrade', () => {
      setTransport(socket.io.engine.transport.name); // 'websocket'
    });

    return () => {
      socket.disconnect();
    };
  }, [url, token, autoConnect]);

  // ─── Emit with optional acknowledgement ───
  const emit = useCallback(<T = any>(event: string, data?: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Not connected'));
        return;
      }
      socketRef.current.emit(event, data, (response: T) => {
        resolve(response);
      });
    });
  }, []);

  // ─── Listen to events ───
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  // ─── Remove listener ───
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.removeAllListeners(event);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    transport,
    emit,
    on,
    off,
  };
}
```

---

### React Chat App (Full Example)

```tsx
// components/ChatRoom.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export function ChatRoom({ room, token }: { room: string; token: string }) {
  const { isConnected, transport, emit, on } = useSocket({
    url: 'http://localhost:3001',
    token,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Join room on mount ───
  useEffect(() => {
    if (!isConnected) return;

    emit('join-room', room).then((response: any) => {
      console.log('Joined room:', response);
      setOnlineUsers(response.users.map((u: any) => u.name));
    });

    return () => { emit('leave-room', room); };
  }, [isConnected, room, emit]);

  // ─── Listen to events ───
  useEffect(() => {
    const unsubs = [
      on('message', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }),
      on('user-joined', ({ name }: { name: string }) => {
        setOnlineUsers(prev => [...prev, name]);
      }),
      on('user-left', ({ userId }: { userId: string }) => {
        setOnlineUsers(prev => prev.filter(u => u !== userId));
        setTypingUsers(prev => prev.filter(u => u !== userId));
      }),
      on('user-typing', ({ name }: { name: string }) => {
        setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
      }),
      on('user-stop-typing', ({ userId }: { userId: string }) => {
        setTypingUsers(prev => prev.filter(u => u !== userId));
      }),
    ];

    return () => unsubs.forEach(unsub => unsub());
  }, [on]);

  // ─── Send message ───
  async function sendMessage() {
    if (!input.trim()) return;

    const response = await emit('message', { room, text: input.trim() });
    console.log('Message delivered:', response);

    setInput('');
    emit('stop-typing', room);
  }

  // ─── Typing indicator ───
  function handleTyping() {
    emit('typing', room);

    // Auto stop-typing after 2 seconds of no input
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emit('stop-typing', room);
    }, 2000);
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      {/* Header */}
      <div className="p-3 border-b flex justify-between items-center">
        <div>
          <span className="font-semibold">#{room}</span>
          <span className="text-sm text-gray-500 ml-2">
            {onlineUsers.length} online
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
            ● {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-gray-400">({transport})</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id}>
            <span className="font-medium text-sm">{msg.userName}</span>
            <span className="text-gray-400 text-xs ml-2">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-400 italic">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="p-3 border-t flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); handleTyping(); }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded text-sm"
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

---

### Next.js + Socket.IO Integration

Socket.IO server can't run inside Next.js API routes (they're serverless). Two approaches:

#### Approach 1: Separate Socket Server (Recommended)

```
Next.js App (port 3000)     Socket.IO Server (port 3001)
├── Frontend (React)    ←──→  ├── WebSocket connections
├── API routes (REST)         ├── Room management
└── SSR/SSG                   └── Real-time events
```

```tsx
// next.config.ts — proxy Socket.IO in development
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3001/socket.io/:path*',
      },
    ];
  },
};
```

#### Approach 2: Custom Server (Runs Socket.IO Inside Next.js Process)

```tsx
// server.ts — custom Next.js server with Socket.IO
import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('message', (data) => {
      io.emit('message', data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected:', socket.id);
    });
  });

  // Make io accessible in API routes
  (global as any).io = io;

  httpServer.listen(3000, () => {
    console.log('Next.js + Socket.IO on :3000');
  });
});
```

```tsx
// app/api/notify/route.ts — emit from API route
export async function POST(request: Request) {
  const { room, message } = await request.json();
  const io = (global as any).io;

  if (io) {
    io.to(room).emit('notification', message);
  }

  return Response.json({ sent: true });
}
```

---

### Socket.IO Namespaces

Separate channels for different features on the same connection.

```tsx
// Server
const chatNamespace = io.of('/chat');
const notifNamespace = io.of('/notifications');

chatNamespace.on('connection', (socket) => {
  // Only chat-related events
  socket.on('message', (data) => { /* ... */ });
});

notifNamespace.on('connection', (socket) => {
  // Only notification events
  socket.on('mark-read', (id) => { /* ... */ });
});

// Client
const chatSocket = io('http://localhost:3001/chat');
const notifSocket = io('http://localhost:3001/notifications');
```

---

### Socket.IO Rooms (Detailed)

```tsx
// Server: Room operations
socket.join('room-1');                        // Join
socket.leave('room-1');                       // Leave
socket.rooms;                                 // Set of rooms this socket is in

io.to('room-1').emit('event', data);          // All in room (including sender)
socket.to('room-1').emit('event', data);      // All in room (EXCLUDING sender)

// Get all sockets in a room
const sockets = await io.in('room-1').fetchSockets();
console.log(`${sockets.length} clients in room-1`);

// Disconnect all sockets in a room
io.in('room-1').disconnectSockets(true);

// A socket can be in multiple rooms
socket.join(['room-1', 'room-2', 'room-3']);
```

---

### Socket.IO Error Handling & Reconnection

```tsx
// Client: Full error handling
const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // error.message could be:
  // - 'Authentication required' (middleware rejected)
  // - 'xhr poll error' (server unreachable)
  // - 'websocket error' (WS connection failed)
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // reason values:
  // 'io server disconnect'  → server called socket.disconnect()
  // 'io client disconnect'  → client called socket.disconnect()
  // 'ping timeout'          → server didn't respond to ping
  // 'transport close'       → connection lost (network issue)
  // 'transport error'       → connection encountered an error

  if (reason === 'io server disconnect') {
    // Server kicked us — need to reconnect manually
    socket.connect();
  }
  // For other reasons, Socket.IO auto-reconnects
});

socket.io.on('reconnect', (attempt) => {
  console.log(`Reconnected after ${attempt} attempts`);
});

socket.io.on('reconnect_attempt', (attempt) => {
  console.log(`Reconnection attempt ${attempt}`);
});

socket.io.on('reconnect_failed', () => {
  console.log('Reconnection failed after all attempts');
  // Show "connection lost" UI to user
});
```

---

## When to Use What

| Scenario | Use | Why |
|----------|-----|-----|
| Chat / instant messaging | **Socket.IO** | Rooms, typing indicators, acknowledgements |
| Collaborative editing (cursors) | **Socket.IO** or raw WebSocket | Bidirectional, low latency |
| Live notifications | **SSE** or Socket.IO | SSE if server-push only, Socket.IO if interactive |
| AI streaming responses | **SSE** | One-way stream, simple |
| Live dashboard / stock prices | **SSE** | Server-push only |
| Online gaming | **Raw WebSocket** | Minimal overhead, binary data |
| Activity feeds | **SSE** | Server-push, auto-reconnect |
| File upload progress (server-side) | **Socket.IO** | Bidirectional status updates |
| Multi-user presence (who's online) | **Socket.IO** | Rooms, join/leave events |

---

## Integrating with TanStack Query

```tsx
// Poll-based real-time (simplest)
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 5000,  // Poll every 5 seconds
});

// WebSocket + TanStack Query
function useRealtimeTodos() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/todos');
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      queryClient.setQueryData(['todos'], (old) => {
        return old.map(t => t.id === update.id ? update : t);
      });
    };
    return () => ws.close();
  }, [queryClient]);

  return useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
}

// Socket.IO + TanStack Query
function useRealtimeMessages(room: string) {
  const queryClient = useQueryClient();
  const { on } = useSocket({ url: 'http://localhost:3001' });

  useEffect(() => {
    const unsub = on('message', (newMessage: Message) => {
      // Append to cache without refetching
      queryClient.setQueryData(['messages', room], (old: Message[] = []) => {
        return [...old, newMessage];
      });
    });
    return unsub;
  }, [on, room, queryClient]);

  return useQuery({
    queryKey: ['messages', room],
    queryFn: () => fetchMessages(room),
  });
}
```

---

## Scaling Socket.IO (Production)

### Redis Adapter (Multi-Server)

When you run multiple server instances (load balanced), Socket.IO needs a shared pub/sub to broadcast across servers.

```bash
npm install @socket.io/redis-adapter redis
```

```tsx
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(httpServer);
io.adapter(createAdapter(pubClient, subClient));

// Now io.to('room').emit() works across ALL server instances!
```

```
Load Balancer
├── Server A (Socket.IO) ──┐
├── Server B (Socket.IO) ──┤── Redis Pub/Sub ── Messages sync across servers
└── Server C (Socket.IO) ──┘
```

### Sticky Sessions

Socket.IO's HTTP long-polling fallback needs sticky sessions (same client → same server). With WebSocket transport, this isn't needed.

```nginx
# nginx.conf
upstream socket_servers {
  ip_hash;  # Sticky sessions based on client IP
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
}
```

---

## Key Terms

- **WebSocket**: Persistent, bidirectional connection over TCP
- **SSE (Server-Sent Events)**: Server-to-client streaming over HTTP
- **Socket.IO**: Library built on WebSocket with rooms, reconnection, fallbacks
- **EventSource**: Browser API for SSE connections
- **Room**: Socket.IO feature to group clients for targeted broadcasting
- **Namespace**: Socket.IO feature to separate communication channels (`/chat`, `/notifications`)
- **Acknowledgement**: Socket.IO callback confirming the other side received the message
- **Emit**: Send an event to one or more clients
- **Broadcast**: Send to all clients except the sender
- **Transport**: Underlying protocol — `polling` (HTTP) or `websocket`
- **Adapter**: Socket.IO plugin for multi-server sync (Redis adapter)
- **Sticky session**: Routing same client to same server (needed for polling fallback)
- **Heartbeat**: Periodic ping/pong to detect dead connections
- **Reconnection**: Auto-reconnect on disconnect (built into Socket.IO and SSE)
- **Fan-out**: Broadcasting one message to multiple clients
- **Backpressure**: When producer sends faster than consumer can handle

---

## Common Interview Questions

1. **When would you use WebSocket vs SSE vs Socket.IO?**
   - WebSocket: simple bidirectional, minimal overhead, gaming
   - SSE: server-push only, notifications, AI streaming
   - Socket.IO: chat, collaboration, rooms, when you need reconnection/rooms/acks out of the box

2. **What does Socket.IO add over raw WebSocket?**
   - Auto-reconnection with backoff, rooms, namespaces, acknowledgements, HTTP polling fallback, middleware, binary support

3. **Can a Socket.IO client connect to a raw WebSocket server?**
   - No. Socket.IO has its own protocol on top of WebSocket. They're incompatible.

4. **How do you scale Socket.IO to multiple servers?**
   - Redis adapter for cross-server pub/sub. Sticky sessions for HTTP polling fallback. WebSocket transport doesn't need sticky sessions.

5. **How do you handle reconnection?**
   - SSE: built-in auto-reconnect. Socket.IO: built-in with configurable backoff. Raw WebSocket: implement manually with exponential backoff.

6. **How do you handle authentication with Socket.IO?**
   - Pass token in `socket.handshake.auth`, verify in `io.use()` middleware before connection is established.

7. **How do you integrate real-time with React state?**
   - Update TanStack Query cache via `setQueryData`, or use Zustand store, or component-local state. Use `useEffect` cleanup to remove listeners.

8. **What are rooms and namespaces in Socket.IO?**
   - Rooms: server-side grouping for broadcasting (e.g., chat rooms). Namespaces: separate communication channels on the same connection (e.g., `/chat`, `/admin`).

9. **What happens when Socket.IO can't establish a WebSocket connection?**
   - Falls back to HTTP long-polling. Automatically upgrades to WebSocket when possible. This is why Socket.IO works behind corporate firewalls that block WebSocket.

10. **How do you send events from a REST API to Socket.IO clients?**
    - Store `io` instance globally or in a module, then call `io.to(room).emit()` from any Express route handler.
