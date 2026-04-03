"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React, { useCallback, useRef, useState } from "react";

type Message = {
  content: string;
  role: "user" | "assistant";
};

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textAreaInput, setTextAreaInput] = useState("");
  const textAreaInputRef = useRef(textAreaInput);
  textAreaInputRef.current = textAreaInput;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(() => {
    const value = textAreaInputRef.current.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { content: value, role: "user" }]);
    setTextAreaInput("");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-center border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Claude</h1>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
              <p className="text-muted-foreground text-lg">How can I help you today?</p>
            </div>
          )}
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className="flex gap-3">
                {/* Avatar */}
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    msg.role === "user"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {msg.role === "user" ? "U" : "C"}
                </div>
                {/* Message content */}
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium mb-1">
                    {msg.role === "user" ? "You" : "Claude"}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t bg-background px-4 pb-6 pt-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border bg-muted/30 p-2">
            <Textarea
              value={textAreaInput}
              onChange={(e) => setTextAreaInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Claude..."
              className="min-h-10 max-h-40 resize-none border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent"
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!textAreaInput.trim()}
              className="shrink-0 rounded-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Claude can make mistakes. Please double-check responses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
