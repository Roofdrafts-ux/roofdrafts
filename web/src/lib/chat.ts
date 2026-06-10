// Live-chat domain helpers — pure functions, no server/db imports so they can
// be unit-tested and shared by API routes.

export const CHAT_MAX_BODY = 2000;
export const CHAT_MAX_NAME = 80;
export const CHAT_MAX_EMAIL = 254;

/**
 * Visitor keys are browser-generated random ids (crypto.randomUUID). Accept a
 * conservative charset/length so junk or injection attempts are rejected early.
 */
export function isValidVisitorKey(key: unknown): key is string {
  return typeof key === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(key);
}

/**
 * Trim + clamp a message body; strips NUL/control chars (except \n and \t)
 * that break Postgres text columns. Returns null when nothing sendable remains.
 */
export function cleanBody(body: unknown): string | null {
  if (typeof body !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const t = body.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();
  if (!t) return null;
  return t.length > CHAT_MAX_BODY ? t.slice(0, CHAT_MAX_BODY) : t;
}

/** Loose email shape check — used for the optional guest contact field. */
export function cleanEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const t = email.trim();
  if (!t || t.length > CHAT_MAX_EMAIL) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null;
}

export function cleanName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const t = name.trim();
  if (!t) return null;
  return t.length > CHAT_MAX_NAME ? t.slice(0, CHAT_MAX_NAME) : t;
}

/** Strip query/hash from the page URL so we never store tokens from links. */
export function cleanPageUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    const u = new URL(url, "https://roofdrafts.com");
    return u.pathname.slice(0, 200);
  } catch {
    return null;
  }
}

export interface ThreadAccessInput {
  thread: { visitorKey: string; userId: string | null };
  visitorKey?: string | null;
  userId?: string | null;
  role?: string | null;
}

/**
 * A thread is readable/writable by: the browser holding its visitorKey, the
 * signed-in user who owns it, or any team member (ESTIMATOR/ADMIN).
 */
export function canAccessThread({ thread, visitorKey, userId, role }: ThreadAccessInput): boolean {
  if (role === "ESTIMATOR" || role === "ADMIN") return true;
  if (visitorKey && thread.visitorKey === visitorKey) return true;
  if (userId && thread.userId === userId) return true;
  return false;
}

export function isTeamRole(role: string | null | undefined): boolean {
  return role === "ESTIMATOR" || role === "ADMIN";
}
