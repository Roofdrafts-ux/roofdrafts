"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignSelect({
  orderId,
  current,
  estimators,
}: {
  orderId: string;
  current: string | null;
  estimators: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(estimatorId: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimatorId: estimatorId || null }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <select
      value={current ?? ""}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d8d2c7", fontSize: 12.5, maxWidth: 160 }}
    >
      <option value="">Unassigned</option>
      {estimators.map((e) => (
        <option key={e.id} value={e.id}>{e.label}</option>
      ))}
    </select>
  );
}
