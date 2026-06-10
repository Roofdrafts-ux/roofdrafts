"use client";
// Admin live-chat inbox — thread list + conversation pane. Polls (no sockets).
import React, { useCallback, useEffect, useRef, useState } from "react";
import "@/components/chat/chat.css";

const POLL_LIST_MS = 8_000;
const POLL_THREAD_MS = 4_000;

interface AdminThread {
  id: string;
  status: "OPEN" | "CLOSED";
  name: string | null;
  email: string | null;
  pageUrl: string | null;
  lastMessageAt: string;
  unread: number;
  preview: string;
  previewFrom: string;
  createdAt: string;
}
interface Message {
  id: string;
  sender: "VISITOR" | "TEAM";
  authorName: string | null;
  body: string;
  createdAt: string;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ChatConsole() {
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);

  const active = threads.find((t) => t.id === activeId) ?? null;

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat/threads");
      if (!res.ok) return;
      const data = (await res.json()) as { threads: AdminThread[] };
      setThreads(data.threads);
    } catch {
      /* transient */
    }
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/threads/${id}/messages`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      setMessages((prev) => {
        if (prev.length !== data.messages.length) {
          requestAnimationFrame(() =>
            msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight })
          );
        }
        return data.messages;
      });
    } catch {
      /* transient */
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, POLL_LIST_MS);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), POLL_THREAD_MS);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  const reply = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/threads/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Couldn't send.");
        return;
      }
      setDraft("");
      await loadMessages(activeId);
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: "OPEN" | "CLOSED") => {
    if (!activeId) return;
    await fetch(`/api/chat/threads/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    loadThreads();
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        border: "1px solid var(--nj2-border, #e3ddd2)",
        borderRadius: 12,
        overflow: "hidden",
        minHeight: 560,
        background: "#fff",
      }}
    >
      {/* thread list */}
      <div style={{ borderRight: "1px solid var(--nj2-border, #e3ddd2)", overflowY: "auto", maxHeight: 720 }}>
        {threads.length === 0 && (
          <div className="rd-admin-empty" style={{ padding: 24 }}>
            No conversations yet. Chats from the website land here.
          </div>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            className="rd-chat-list-item"
            style={activeId === t.id ? { background: "var(--nj2-bg-muted, #f4efe7)" } : undefined}
            onClick={() => setActiveId(t.id)}
          >
            {t.unread > 0 && <span className="rd-chat-dot-unread" />}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, display: "flex", gap: 6, alignItems: "baseline" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name || t.email || "Anonymous visitor"}
                </span>
                {t.status === "CLOSED" && (
                  <span style={{ fontSize: 10, color: "var(--nj2-fg-4, #9b958a)", fontWeight: 500 }}>closed</span>
                )}
              </div>
              <div className="rd-chat-list-preview">
                {t.previewFrom === "TEAM" ? "You: " : ""}
                {t.preview}
              </div>
              <div className="rd-chat-list-time">{fmt(t.lastMessageAt)}</div>
            </div>
          </button>
        ))}
      </div>

      {/* conversation pane */}
      {!active ? (
        <div className="rd-admin-empty" style={{ display: "grid", placeItems: "center" }}>
          Select a conversation
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", maxHeight: 720 }}>
          <div className="rd-chat-head">
            <div>
              <div className="rd-chat-head-title">{active.name || active.email || "Anonymous visitor"}</div>
              <div className="rd-chat-head-sub">
                {active.email ? `${active.email} · ` : ""}
                started {fmt(active.createdAt)}
                {active.pageUrl ? ` on ${active.pageUrl}` : ""}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button
              className="nj2-btn nj2-btn-sm nj2-btn-secondary"
              onClick={() => setStatus(active.status === "OPEN" ? "CLOSED" : "OPEN")}
            >
              {active.status === "OPEN" ? "Close" : "Reopen"}
            </button>
          </div>

          <div className="rd-chat-msgs" ref={msgsRef} style={{ background: "#faf7f2" }}>
            {messages.map((m) => (
              <React.Fragment key={m.id}>
                {/* In the admin console, TEAM messages sit on the right. */}
                <div
                  className="rd-chat-bubble"
                  style={
                    m.sender === "TEAM"
                      ? { alignSelf: "flex-end", background: "var(--tp-accent, #BE5630)", color: "#fff", borderBottomRightRadius: 4 }
                      : { alignSelf: "flex-start", background: "#fff", border: "1px solid var(--nj2-border, #e3ddd2)", borderBottomLeftRadius: 4 }
                  }
                >
                  {m.body}
                </div>
                <div
                  className="rd-chat-msg-meta"
                  style={{ alignSelf: m.sender === "TEAM" ? "flex-end" : "flex-start" }}
                >
                  {m.sender === "TEAM" ? `${m.authorName ?? "Team"} · ` : ""}
                  {fmt(m.createdAt)}
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="rd-chat-composer">
            <div className="rd-chat-input-row">
              <textarea
                className="rd-chat-input"
                placeholder="Reply…"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    reply();
                  }
                }}
              />
              <button className="rd-chat-send" onClick={reply} disabled={!draft.trim() || sending} aria-label="Send reply">
                ➤
              </button>
            </div>
            {error && <div className="rd-chat-error">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
