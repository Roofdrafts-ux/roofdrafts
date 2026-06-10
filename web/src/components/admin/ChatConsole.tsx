"use client";
// Admin live-chat inbox — thread list + conversation pane. Polls (no sockets).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/primitives";
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

/** Append a poll page, deduping by id (cursor overlap is expected). */
function mergeMessages(prev: Message[], page: Message[]): Message[] {
  if (page.length === 0) return prev;
  const seen = new Set(prev.map((m) => m.id));
  const fresh = page.filter((m) => !seen.has(m.id));
  return fresh.length === 0 ? prev : [...prev, ...fresh];
}

export function ChatConsole() {
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  // Guards against a slow response for thread A painting under thread B.
  const activeIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const active = threads.find((t) => t.id === activeId) ?? null;

  const scrollToEnd = () => {
    requestAnimationFrame(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight }));
  };

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

  /** Incremental poll: only fetch messages newer than the last one we have. */
  const loadMessages = useCallback(async (id: string, current: Message[]) => {
    try {
      const last = current[current.length - 1];
      const qs = last ? `?after=${encodeURIComponent(last.createdAt)}` : "";
      const res = await fetch(`/api/chat/threads/${id}/messages${qs}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      if (activeIdRef.current !== id) return; // admin switched threads mid-flight
      setMessages((prev) => mergeMessages(prev, data.messages));
      if (data.messages.length > 0) scrollToEnd();
    } catch {
      /* transient */
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      loadThreads();
    }, POLL_LIST_MS);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (!activeId) return;
    activeIdRef.current = activeId;
    setMessages([]);
    loadMessages(activeId, []);
    const t = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      loadMessages(activeId, messagesRef.current);
    }, POLL_THREAD_MS);
    return () => {
      clearInterval(t);
      activeIdRef.current = null;
    };
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
      await loadMessages(activeId, messagesRef.current);
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
                aria-label="Reply"
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
                <Icon name="send" size={17} />
              </button>
            </div>
            {error && <div className="rd-chat-error">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
