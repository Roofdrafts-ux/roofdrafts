"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Deliverable {
  id: string;
  type: "PDF" | "XACTIMATE_ESX" | "XML";
  url: string | null;
}

const LABEL: Record<string, string> = {
  PDF: "PDF",
  XACTIMATE_ESX: "ESX",
  XML: "XML",
};

export function DeliverablesPanel({
  orderId,
  hasModel,
  isMock,
  deliverables,
}: {
  orderId: string;
  hasModel: boolean;
  isMock: boolean;
  deliverables: Deliverable[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/orders/${orderId}/deliverables`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Generation failed.");
    }
    setBusy(false);
  }

  return (
    <div className="rd-deliv">
      <div className="rd-deliv-head">
        <span className="rd-deliv-title">Deliverables</span>
        <button
          className="nj2-btn nj2-btn-secondary nj2-btn-sm"
          onClick={generate}
          disabled={busy || !hasModel}
          title={hasModel ? "" : "Save a roof model first"}
        >
          {busy ? "Generating…" : deliverables.length ? "Regenerate" : "Generate"}
        </button>
      </div>

      {isMock && deliverables.length > 0 && (
        <div className="rd-deliv-mock">
          DRAFT — mock imagery. Files are watermarked and blocked from customer delivery.
        </div>
      )}

      {deliverables.length === 0 ? (
        <p className="rd-deliv-empty">
          {hasModel ? "No files yet — generate the set." : "Save a roof model to enable generation."}
        </p>
      ) : (
        <div className="rd-deliv-files">
          {deliverables.map((d) => (
            <a key={d.id} href={d.url ?? "#"} className="rd-file-btn" target="_blank" rel="noreferrer">
              {LABEL[d.type] ?? d.type}
            </a>
          ))}
        </div>
      )}
      {err && <div className="rd-status-err">{err}</div>}
    </div>
  );
}
