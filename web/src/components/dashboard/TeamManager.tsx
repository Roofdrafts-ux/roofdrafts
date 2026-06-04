"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "OWNER" | "ADMIN" | "MEMBER";
export type TeamMember = { id: string; name: string | null; email: string; role: Role; isSelf: boolean };
export type PendingInvite = { id: string; email: string; role: Role };

export function TeamManager({
  members,
  invitations,
  canManage,
  isOwner,
}: {
  members: TeamMember[];
  invitations: PendingInvite[];
  canManage: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    setBusy(true);
    setMsg(null);
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      return true;
    }
    const d = await res.json().catch(() => ({}));
    setMsg({ tone: "err", text: d.error ?? "Something went wrong." });
    return false;
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (await call("/api/org/invitations", "POST", { email, role })) {
      setMsg({ tone: "ok", text: `Invitation sent to ${email}.` });
      setEmail("");
    }
  }

  const cell: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid var(--nj2-border-subtle,#eee)", fontSize: 14 };

  return (
    <div style={{ maxWidth: 720 }}>
      {canManage && (
        <form onSubmit={invite} style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Invite teammate</label>
            <input
              type="email" required value={email} placeholder="teammate@company.com"
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d8d2c7", fontSize: 14 }}
            />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #d8d2c7", fontSize: 14 }}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="nj2-btn nj2-btn-brand" disabled={busy}>Send invite</button>
        </form>
      )}

      {msg && <p style={{ fontSize: 13.5, color: msg.tone === "ok" ? "#2e7d32" : "#c0392b", marginBottom: 16 }}>{msg.text}</p>}

      <div style={{ border: "1px solid var(--nj2-border-subtle,#eee)", borderRadius: 10, overflow: "hidden" }}>
        {members.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, ...cell }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{m.name ?? m.email}{m.isSelf ? " (you)" : ""}</div>
              <div style={{ color: "var(--nj2-fg-3)", fontSize: 12.5 }}>{m.email}</div>
            </div>
            {isOwner && !m.isSelf ? (
              <select
                value={m.role}
                disabled={busy}
                onChange={(e) => call(`/api/org/members/${m.id}`, "PATCH", { role: e.target.value })}
                style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #d8d2c7", fontSize: 13 }}
              >
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
            ) : (
              <span style={{ fontSize: 12.5, color: "var(--nj2-brand-600,#A2451F)", fontWeight: 600 }}>{m.role}</span>
            )}
            {canManage && !m.isSelf && (
              <button
                type="button" disabled={busy}
                onClick={() => { if (confirm(`Remove ${m.email}?`)) call(`/api/org/members/${m.id}`, "DELETE"); }}
                style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 13 }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && invitations.length > 0 && (
        <>
          <h3 style={{ margin: "26px 0 10px", fontSize: 15 }}>Pending invitations</h3>
          <div style={{ border: "1px solid var(--nj2-border-subtle,#eee)", borderRadius: 10, overflow: "hidden" }}>
            {invitations.map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, ...cell }}>
                <div style={{ flex: 1 }}>{i.email}</div>
                <span style={{ fontSize: 12.5, color: "var(--nj2-fg-3)" }}>{i.role}</span>
                <button
                  type="button" disabled={busy}
                  onClick={() => call(`/api/org/invitations/${i.id}`, "DELETE")}
                  style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 13 }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
