"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AiDraftButton({ orderId, hasModel }: { orderId: string; hasModel: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function draft() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/orders/${orderId}/ai-draft`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "AI draft failed.");
    }
    setBusy(false);
  }

  return (
    <span className="rd-aidraft">
      <button
        className="nj2-btn nj2-btn-secondary nj2-btn-sm"
        onClick={draft}
        disabled={busy}
        title={hasModel ? "Re-run the AI draft (overwrites the current model)" : "Auto-measure this roof"}
      >
        {busy ? "Drafting…" : hasModel ? "Re-draft with AI" : "✨ AI-draft roof"}
      </button>
      {err && <span className="rd-status-err">{err}</span>}
    </span>
  );
}
