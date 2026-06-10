"use client";
// ════════════════════════════════════════════════════════════════
// Roofdrafts — live chat widget (launcher + panel, Intercom-style)
// Guests get a random visitorKey in localStorage; signed-in users are
// linked server-side via their session cookie. Polling, no websockets.
// The key is sent via the X-Visitor-Key header (it's a bearer credential —
// keep it out of URLs/access logs).
// ════════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon, Wordmark } from "../primitives";
import "./chat.css";

const KEY_STORAGE = "rd_chat_key";
const EMAIL_STORAGE = "rd_chat_email";
const POLL_THREAD_MS = 4_000;
const POLL_BADGE_MS = 30_000;

interface ThreadSummary {
  id: string;
  status: string;
  lastMessageAt: string;
  unread: number;
  preview: string;
  previewFrom: string;
}
interface Message {
  id: string;
  sender: "VISITOR" | "TEAM";
  authorName: string | null;
  body: string;
  createdAt: string;
}

/** Storage can be unavailable (private mode, blocked cookies) — never throw. */
function storageGet(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* in-memory fallback below keeps the session working */
  }
}

let memoryKey: string | null = null; // fallback when localStorage is blocked
function getVisitorKey(create: boolean): string | null {
  let k = storageGet(KEY_STORAGE) ?? memoryKey;
  if (!k && create) {
    k = crypto.randomUUID().replace(/-/g, "");
    memoryKey = k;
    storageSet(KEY_STORAGE, k);
  }
  return k;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Append a poll page, deduping by id (cursor overlap is expected). */
function mergeMessages(prev: Message[], page: Message[]): Message[] {
  if (page.length === 0) return prev;
  const seen = new Set(prev.map((m) => m.id));
  const fresh = page.filter((m) => !seen.has(m.id));
  return fresh.length === 0 ? prev : [...prev, ...fresh];
}

type View = "home" | "list" | "thread";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null); // null = composing a new conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailField, setShowEmailField] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Guards against a slow response for thread A painting under thread B.
  const activeThreadRef = useRef<string | null>(null);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight });
    });
  };

  const keyHeaders = (): HeadersInit => {
    const key = getVisitorKey(false);
    return key ? { "X-Visitor-Key": key } : {};
  };

  const loadThreads = useCallback(async (): Promise<ThreadSummary[]> => {
    const key = getVisitorKey(false);
    if (!key) return [];
    try {
      const res = await fetch("/api/chat/threads", { headers: { "X-Visitor-Key": key } });
      if (!res.ok) return [];
      const data = (await res.json()) as { threads: ThreadSummary[] };
      setThreads(data.threads);
      setUnread(data.threads.reduce((s, t) => s + t.unread, 0));
      return data.threads;
    } catch {
      return [];
    }
  }, []);

  /** Incremental poll: only fetch messages newer than the last one we have. */
  const loadMessages = useCallback(async (id: string, current: Message[]) => {
    try {
      const last = current[current.length - 1];
      const qs = last ? `?after=${encodeURIComponent(last.createdAt)}` : "";
      const res = await fetch(`/api/chat/threads/${id}/messages${qs}`, { headers: keyHeaders() });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      if (activeThreadRef.current !== id) return; // user switched threads mid-flight
      setMessages((prev) => mergeMessages(prev, data.messages));
      if (data.messages.length > 0) scrollToEnd();
    } catch {
      /* transient poll failure — keep what we have */
    }
  }, []);

  // Track messages in a ref so the poll interval reads fresh state without
  // re-arming on every message.
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  // Unread badge poll while the panel is closed (only for returning chatters).
  useEffect(() => {
    if (open || !getVisitorKey(false)) return;
    loadThreads();
    const t = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      loadThreads();
    }, POLL_BADGE_MS);
    return () => clearInterval(t);
  }, [open, loadThreads]);

  // Live message poll while a conversation is on screen.
  useEffect(() => {
    if (!open || view !== "thread" || !threadId) return;
    activeThreadRef.current = threadId;
    loadMessages(threadId, messagesRef.current);
    const t = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      loadMessages(threadId, messagesRef.current);
    }, POLL_THREAD_MS);
    return () => {
      clearInterval(t);
      activeThreadRef.current = null;
    };
  }, [open, view, threadId, loadMessages]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openPanel = () => {
    setOpen(true);
    setView("home");
    setError(null);
    loadThreads();
    setEmail(storageGet(EMAIL_STORAGE) ?? "");
  };

  const openThread = (id: string | null) => {
    setThreadId(id);
    setMessages([]);
    setView("thread");
    setError(null);
    // New conversations always offer the (prefilled) contact field so a
    // mistyped email can be corrected; existing threads hide it.
    setShowEmailField(id === null);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  /** "Send us a message" card → latest open conversation, or a fresh one. */
  const startFromHome = async () => {
    const existing = threads.length > 0 ? threads : await loadThreads();
    const openThreads = existing.filter((t) => t.status === "OPEN");
    openThread(openThreads[0]?.id ?? null);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const key = getVisitorKey(true)!;
      let res: Response;
      if (threadId) {
        res = await fetch(`/api/chat/threads/${threadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorKey: key, body: text }),
        });
      } else {
        res = await fetch(`/api/chat/threads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorKey: key,
            body: text,
            email: email.trim() || undefined,
            pageUrl: window.location.pathname,
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Couldn't send — please try again.");
        return;
      }
      if (email.trim()) storageSet(EMAIL_STORAGE, email.trim());
      setDraft("");
      if (!threadId) {
        const t = (data as { thread: { id: string } }).thread;
        setShowEmailField(false);
        activeThreadRef.current = t.id;
        setThreadId(t.id);
        await loadMessages(t.id, []);
      } else {
        await loadMessages(threadId, messagesRef.current);
      }
      scrollToEnd();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onComposerKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {open && (
        <div className="rd-chat-panel" role="dialog" aria-label="Roofdrafts live chat">
          {view === "home" && (
            <div className="rd-chat-home">
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 10px 0" }}>
                <button className="rd-chat-iconbtn" aria-label="Close chat" onClick={() => setOpen(false)}>
                  <Icon name="x" size={17} />
                </button>
              </div>
              <div className="rd-chat-home-head">
                <Wordmark size={26} />
                <h2 className="rd-chat-greeting">
                  Hi there 👋
                  <br />
                  How can we help?
                </h2>
              </div>
              <button className="rd-chat-card" onClick={startFromHome}>
                <div>
                  <div className="rd-chat-card-title">Send us a message</div>
                  <div className="rd-chat-card-sub">We typically reply in under 5 minutes</div>
                </div>
                <span className="rd-chat-card-arrow">
                  <Icon name="send" size={17} />
                </span>
              </button>
              <div className="rd-chat-home-foot">
                Mon–Sat · 7am–7pm CT · (682) 325-7399
              </div>
            </div>
          )}

          {view === "list" && (
            <>
              <div className="rd-chat-head">
                <div>
                  <div className="rd-chat-head-title">Messages</div>
                </div>
                <div style={{ flex: 1 }} />
                <button className="rd-chat-iconbtn" aria-label="Close chat" onClick={() => setOpen(false)}>
                  <Icon name="x" size={17} />
                </button>
              </div>
              <div className="rd-chat-list">
                {threads.length === 0 && (
                  <div className="rd-chat-empty-hint" style={{ padding: "40px 30px" }}>
                    No conversations yet.
                  </div>
                )}
                {threads.map((t) => (
                  <button key={t.id} className="rd-chat-list-item" onClick={() => openThread(t.id)}>
                    {t.unread > 0 && <span className="rd-chat-dot-unread" />}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="rd-chat-list-preview">
                        {t.previewFrom === "TEAM" ? "Roofdrafts: " : "You: "}
                        {t.preview}
                      </div>
                      <div className="rd-chat-list-time">
                        {timeLabel(t.lastMessageAt)}
                        {t.status === "CLOSED" ? " · closed" : ""}
                      </div>
                    </div>
                    <Icon name="chevron-down" size={15} style={{ transform: "rotate(-90deg)", color: "var(--nj2-fg-4)" }} />
                  </button>
                ))}
                <button
                  className="rd-chat-card"
                  style={{ margin: "14px 18px" }}
                  onClick={() => openThread(null)}
                >
                  <div>
                    <div className="rd-chat-card-title">New conversation</div>
                    <div className="rd-chat-card-sub">We typically reply in under 5 minutes</div>
                  </div>
                  <span className="rd-chat-card-arrow">
                    <Icon name="send" size={17} />
                  </span>
                </button>
              </div>
            </>
          )}

          {view === "thread" && (
            <>
              <div className="rd-chat-head">
                <button className="rd-chat-iconbtn" aria-label="Back" onClick={() => { setView(threads.length ? "list" : "home"); loadThreads(); }}>
                  <Icon name="arrow-left" size={17} />
                </button>
                <div>
                  <div className="rd-chat-head-title">Roofdrafts</div>
                  <div className="rd-chat-head-sub">Typically replies in under 5 minutes</div>
                </div>
                <div style={{ flex: 1 }} />
                <button className="rd-chat-iconbtn" aria-label="Close chat" onClick={() => setOpen(false)}>
                  <Icon name="x" size={17} />
                </button>
              </div>
              <div className="rd-chat-msgs" ref={msgsRef}>
                {messages.length === 0 && (
                  <div className="rd-chat-empty-hint">
                    Ask us anything — pricing, turnaround, coverage, or a report you&apos;ve ordered.
                  </div>
                )}
                {messages.map((m) => (
                  <React.Fragment key={m.id}>
                    <div
                      className={`rd-chat-bubble ${
                        m.sender === "VISITOR" ? "rd-chat-bubble-visitor" : "rd-chat-bubble-team"
                      }`}
                    >
                      {m.body}
                    </div>
                    <div
                      className={`rd-chat-msg-meta ${
                        m.sender === "VISITOR" ? "rd-chat-msg-meta-visitor" : "rd-chat-msg-meta-team"
                      }`}
                    >
                      {m.sender === "TEAM" ? `${m.authorName ?? "Roofdrafts"} · ` : ""}
                      {timeLabel(m.createdAt)}
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className="rd-chat-composer">
                {showEmailField && (
                  <div className="rd-chat-email-row">
                    <input
                      className="rd-chat-email-input"
                      type="email"
                      placeholder="Email (optional — so we can follow up)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-label="Your email"
                    />
                  </div>
                )}
                <div className="rd-chat-input-row">
                  <textarea
                    ref={inputRef}
                    className="rd-chat-input"
                    placeholder="Write a message…"
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onComposerKey}
                    aria-label="Message"
                  />
                  <button
                    className="rd-chat-send"
                    onClick={send}
                    disabled={!draft.trim() || sending}
                    aria-label="Send message"
                  >
                    <Icon name="send" size={17} />
                  </button>
                </div>
                {error && <div className="rd-chat-error">{error}</div>}
              </div>
            </>
          )}

          <div className="rd-chat-tabs">
            <button
              className={`rd-chat-tab ${view === "home" ? "rd-chat-tab-active" : ""}`}
              onClick={() => setView("home")}
            >
              <Icon name="house" size={18} />
              Home
            </button>
            <button
              className={`rd-chat-tab ${view !== "home" ? "rd-chat-tab-active" : ""}`}
              onClick={() => {
                setView("list");
                loadThreads();
              }}
            >
              <Icon name="message-circle" size={18} />
              Messages
              {unread > 0 && <span className="rd-chat-tab-badge">{unread}</span>}
            </button>
          </div>
        </div>
      )}

      <button
        className="rd-chat-launcher"
        aria-label={open ? "Close live chat" : "Open live chat"}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <Icon name={open ? "chevron-down" : "message-circle"} size={24} />
        {!open && unread > 0 && <span className="rd-chat-launcher-badge">{unread}</span>}
      </button>
    </>
  );
}
