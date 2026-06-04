"use client";

import { useState } from "react";

export function AccountActions() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function requestDeletion() {
    if (!confirm("Request deletion of your account and data? Our team will process this and contact you.")) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/account/delete-request", { method: "POST" });
    setBusy(false);
    setMsg(
      res.ok
        ? { tone: "ok", text: "Deletion request received. We'll process it and follow up by email." }
        : { tone: "err", text: "Could not submit the request. Please try again." }
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
      <div>
        <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>Export your data</h3>
        <p style={{ fontSize: 13, color: "var(--nj2-fg-3,#777)", margin: "0 0 10px" }}>
          Download everything we hold about you — profile, orders, organizations and consent records — as JSON.
        </p>
        <a href="/api/account/export" className="nj2-btn nj2-btn-brand nj2-btn-sm">Download my data</a>
      </div>

      <div style={{ borderTop: "1px solid var(--nj2-border-subtle,#eee)", paddingTop: 16 }}>
        <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>Delete your account</h3>
        <p style={{ fontSize: 13, color: "var(--nj2-fg-3,#777)", margin: "0 0 10px" }}>
          Request erasure of your account and personal data. We&apos;ll process it within our regulatory window.
        </p>
        <button type="button" onClick={requestDeletion} disabled={busy}
          className="nj2-btn nj2-btn-sm" style={{ border: "1px solid #c0392b", color: "#c0392b", background: "transparent" }}>
          {busy ? "Submitting…" : "Request account deletion"}
        </button>
      </div>

      {msg && <p style={{ fontSize: 13.5, color: msg.tone === "ok" ? "#2e7d32" : "#c0392b" }}>{msg.text}</p>}
    </div>
  );
}
