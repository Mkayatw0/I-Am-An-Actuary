"use client";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL || "http://localhost:8000";

async function getToken(): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export async function createConversation(
  title = "New Conversation"
): Promise<Conversation> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to create conversation");
  }
  return res.json();
}

export async function listConversations(): Promise<Conversation[]> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to list conversations");
  const data = await res.json();
  return data.conversations;
}

export async function getConversation(
  id: string
): Promise<Conversation> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Conversation not found");
  return res.json();
}

export async function listMessages(
  conversationId: string
): Promise<Message[]> {
  const token = await getToken();
  const res = await fetch(
    `${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Failed to list messages");
  const data = await res.json();
  return data.messages;
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ user_message: Message; assistant_message: Message }> {
  const token = await getToken();
  const res = await fetch(
    `${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to send message");
  }
  return res.json();
}

export async function* streamMessage(
  conversationId: string,
  content: string
): AsyncGenerator<string> {
  const token = await getToken();
  const res = await fetch(
    `${API_BASE}/api/v1/chat/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to stream message");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data.trim() === "[DONE]") return;
        yield data;
      }
    }
  }
}