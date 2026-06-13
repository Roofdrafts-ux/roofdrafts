"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RevisionButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [openForm, setOpenForm] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      if (res.ok) {
        setDone(true);
        setOpenForm(false);
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "Couldn't submit — please try again.");
      }
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span style={{ fontSize: 12, color: "var(--nj2-success,#2e7d32)" }}>Revision requested ✓</span>;

  if (!openForm) {
    return (
      <button
        type="button"
        onClick={() => setOpenForm(true)}
        style={{ background: "none", border: "none", color: "var(--nj2-brand-600,#A2451F)", cursor: "pointer", fontSize: 12.5, padding: 0, fontWeight: 600 }}
      >
        Request revision
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--nj2-fg-2,#585041)" }}>
        What needs revising? <span style={{ fontWeight: 400, color: "var(--nj2-fg-3,#6B6149)" }}>(optional)</span>
      </label>
      <textarea
        className="rd-input"
        rows={2}
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. detached garage was missed"
        style={{ resize: "vertical", minHeight: 56, padding: "8px 10px", lineHeight: 1.4 }}
        aria-label="Revision reason"
      />
      {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--nj2-danger,#c0392b)" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="nj2-btn nj2-btn-brand nj2-btn-sm" onClick={submit} disabled={busy}>
          {busy ? "Sending…" : "Submit request"}
        </button>
        <button type="button" className="nj2-btn nj2-btn-secondary nj2-btn-sm" onClick={() => { setOpenForm(false); setError(null); }} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
