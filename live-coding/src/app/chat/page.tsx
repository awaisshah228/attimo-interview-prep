"use client";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
type Message = {
  content: string;
};

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textAreaInput, setTextAreaInput] = useState("");

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setMessages([...messages, { content: textAreaInput }]);
  };
  return (
    <div className="h-full">
      <div>
        {messages.map((item, index) => {
          return <div key={index}>{item.content ?? ""}</div>;
        })}
      </div>

      <div
        style={{
          position: "fixed",
          width: "100%",
          bottom: "0px",
        }}
        className="flex flex-row border-blue-100 px-[40]"
      >
        <Textarea
          onChange={(e) => {
            try {
              setTextAreaInput(e.target.value);
            } catch (error) { }
          } }
          className="bg-transparent border-none "
        ></Textarea>
        <button
          onClick={(e) => {
            handleSubmit(e);
          } }
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
