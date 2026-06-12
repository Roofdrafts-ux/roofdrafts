"use client";

import { useState } from "react";

/**
 * Change/set password. `hasPassword=false` (OAuth-only accounts) hides the
 * current-password field and lets the user set their first password.
 * `mustChange` surfaces the admin temp-password nudge.
 */
export function ChangePasswordForm({
  hasPassword,
  mustChange,
}: {
  hasPassword: boolean;
  mustChange: boolean;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) return setMsg({ tone: "err", text: "New password must be at least 8 characters." });
    if (next !== confirm) return setMsg({ tone: "err", text: "The two new passwords don't match." });
    setBusy(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current || undefined, newPassword: next }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ tone: "ok", text: "Password updated." });
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ tone: "err", text: (d as { error?: string }).error ?? "Couldn't update password." });
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>{hasPassword ? "Change password" : "Set a password"}</h3>
      <p style={{ fontSize: 13, color: "var(--nj2-fg-3,#777)", margin: "0 0 12px" }}>
        {mustChange
          ? "Your account was set up with a temporary password — choose your own to finish."
          : hasPassword
            ? "Use at least 8 characters."
            : "You sign in with Google. Add a password if you'd like an email + password option too."}
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360 }}>
        {hasPassword && (
          <input
            type="password"
            className="rd-input"
            autoComplete="current-password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            aria-label="Current password"
          />
        )}
        <input
          type="password"
          className="rd-input"
          autoComplete="new-password"
          placeholder="New password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          aria-label="New password"
        />
        <input
          type="password"
          className="rd-input"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-label="Confirm new password"
        />
        <button type="submit" className="nj2-btn nj2-btn-brand nj2-btn-sm" disabled={busy} style={{ alignSelf: "flex-start" }}>
          {busy ? "Saving…" : hasPassword ? "Update password" : "Set password"}
        </button>
        {msg && <p style={{ fontSize: 13.5, margin: 0, color: msg.tone === "ok" ? "#2e7d32" : "#c0392b" }}>{msg.text}</p>}
      </form>
    </div>
  );
}
