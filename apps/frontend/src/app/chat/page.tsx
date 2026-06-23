"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createConversation,
  listConversations,
  listMessages,
  streamMessage,
  type Conversation,
  type Message,
} from "@/lib/chat/api";

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    listConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    listMessages(activeId)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = useCallback(async () => {
    try {
      const conv = await createConversation();
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
    } catch {
      // ignore
    }
  }, []);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !activeId || streaming) return;

    setInput("");
    setStreaming(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeId,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Add a placeholder assistant message
    const tempAssistantMsg: Message = {
      id: `temp-ai-${Date.now()}`,
      conversation_id: activeId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, tempAssistantMsg]);

    try {
      let fullContent = "";
      for await (const chunk of streamMessage(activeId, content)) {
        fullContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant" && last.id === tempAssistantMsg.id) {
            updated[updated.length - 1] = { ...last, content: fullContent };
          }
          return updated;
        });
      }

      // Refresh conversations list to get updated title
      const convs = await listConversations();
      setConversations(convs);
    } catch {
      // Mark the assistant message as errored
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && last.id === tempAssistantMsg.id) {
          updated[updated.length - 1] = {
            ...last,
            content: "Sorry, an error occurred while generating a response.",
          };
        }
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, activeId, streaming]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-72 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            onClick={handleNewConversation}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + New
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {loadingConvs ? (
            <p className="p-2 text-sm text-muted-foreground">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeId === conv.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent"
                }`}
              >
                {conv.title}
              </button>
            ))
          )}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/dashboard"
            className="block rounded-md bg-secondary px-3 py-2 text-center text-sm font-medium hover:bg-secondary/80"
          >
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex flex-1 flex-col">
        {!activeId ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Actuarial Assistant</h1>
              <p className="mt-2 text-muted-foreground">
                Select a conversation or create a new one to get started.
              </p>
              <button
                onClick={handleNewConversation}
                className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                New Conversation
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">
                    Send a message to start the conversation.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={streaming}
                  placeholder={
                    streaming
                      ? "AI is responding..."
                      : "Type your message..."
                  }
                  className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {streaming ? "..." : "Send"}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}