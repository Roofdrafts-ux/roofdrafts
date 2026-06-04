"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RevisionButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function go() {
    const reason = window.prompt("What needs revising? (optional — helps the estimator)");
    if (reason === null) return; // cancelled
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  if (done) return <span style={{ fontSize: 12, color: "#2e7d32" }}>Revision requested ✓</span>;
  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      style={{ background: "none", border: "none", color: "var(--nj2-brand-600,#A2451F)", cursor: "pointer", fontSize: 12.5, padding: 0, fontWeight: 600 }}
    >
      {busy ? "Sending…" : "Request revision"}
    </button>
  );
}
