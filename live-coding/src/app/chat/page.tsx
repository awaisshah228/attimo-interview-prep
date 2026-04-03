"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
type Role = "user" | "assistant";

type Message = {
  id: string;
  content: string;
  role: Role;
  timestamp: Date;
};

// ─── Avatar ──────────────────────────────────────────────────────────
function Avatar({ role }: { role: Role }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold select-none",
        role === "user"
          ? "bg-muted text-muted-foreground"
          : "bg-primary text-primary-foreground"
      )}
    >
      {role === "user" ? "U" : "C"}
    </div>
  );
}

// ─── ChatMessage ─────────────────────────────────────────────────────
function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="group flex gap-3 py-4" role="row">
      <Avatar role={message.role} />
      <div className="flex-1 space-y-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {message.role === "user" ? "You" : "Claude"}
          </span>
          <time
            dateTime={message.timestamp.toISOString()}
            className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 py-4" role="status" aria-label="Claude is typing">
      <Avatar role="assistant" />
      <div className="flex items-center gap-1 pt-2">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
        C
      </div>
      <h2 className="text-xl font-semibold">How can I help you today?</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ask me anything — I can help with writing, analysis, coding, math, and
        much more.
      </p>
    </div>
  );
}

// ─── ChatInput ───────────────────────────────────────────────────────
function ChatInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (content: string) => void;
  isLoading: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue("");
    // Re-focus after clearing
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [value, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        submit();
      }
    },
    [submit]
  );

  return (
    <div className="border-t bg-background/80 px-4 pb-6 pt-3 backdrop-blur-sm">
      <div className="mx-auto max-w-2xl">
        <label htmlFor={inputId} className="sr-only">
          Message Claude
        </label>
        <div className="flex items-end gap-2 rounded-2xl border bg-muted/30 p-2 transition-colors focus-within:border-ring">
          <Textarea
            ref={textareaRef}
            id={inputId}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Claude..."
            disabled={isLoading}
            aria-label="Message input"
            className="min-h-10 max-h-48 resize-none border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent"
            rows={1}
          />
          <Button
            size="icon"
            onClick={submit}
            disabled={!value.trim() || isLoading}
            aria-label="Send message"
            className="shrink-0 rounded-xl"
          >
            {isLoading ? (
              <svg
                className="size-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Claude can make mistakes. Please double-check responses.
        </p>
      </div>
    </div>
  );
}

// ─── Main ChatPanel ──────────────────────────────────────────────────
let messageCounter = 0;
function createId() {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: createId(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // e.g. const res = await fetch("/api/chat", { method: "POST", body: ... })
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMsg: Message = {
        id: createId(),
        content: `This is a simulated response. Connect an API route to get real responses.\n\nYou said: "${content}"`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: createId(),
        content: "Sorry, something went wrong. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="w-20" />
        <h1 className="text-lg font-semibold">Claude</h1>
        <div className="flex w-20 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setMessages([]);
              setIsLoading(false);
            }}
            disabled={messages.length === 0}
            aria-label="New conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="mx-auto max-w-2xl divide-y px-4">
          {messages.length === 0 && !isLoading && <EmptyState />}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
