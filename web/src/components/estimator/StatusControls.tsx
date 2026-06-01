"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma/enums";

/** Forward transitions an estimator can take from each status. */
const NEXT: Record<string, { status: OrderStatus; label: string; tone: string }[]> = {
  PENDING: [{ status: "MODELING", label: "Start modeling", tone: "brand" }],
  MODELING: [{ status: "QA_REVIEW", label: "Send to QA", tone: "brand" }],
  QA_REVIEW: [
    { status: "DELIVERED", label: "Mark delivered", tone: "brand" },
    { status: "REVISION_REQUESTED", label: "Request revision", tone: "secondary" },
    { status: "MODELING", label: "Back to modeling", tone: "secondary" },
  ],
  REVISION_REQUESTED: [{ status: "MODELING", label: "Resume modeling", tone: "brand" }],
  ON_HOLD: [{ status: "MODELING", label: "Resume", tone: "brand" }],
  DELIVERED: [],
  CANCELLED: [],
};

export function StatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const options = NEXT[status] ?? [];

  async function transition(next: OrderStatus) {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Transition failed.");
    }
    setBusy(false);
  }

  if (options.length === 0) {
    return <span className="rd-status-final">No further actions.</span>;
  }

  return (
    <div className="rd-status-controls">
      <div className="rd-status-btns">
        {options.map((o) => (
          <button
            key={o.status}
            className={`nj2-btn nj2-btn-${o.tone} nj2-btn-sm`}
            disabled={busy}
            onClick={() => transition(o.status)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {err && <div className="rd-status-err">{err}</div>}
    </div>
  );
}
