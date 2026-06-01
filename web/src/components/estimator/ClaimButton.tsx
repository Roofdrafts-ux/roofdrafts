"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClaimButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function claim() {
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/claim`, { method: "POST" });
    if (res.ok) {
      router.push(`/estimator/${orderId}`);
    } else {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <button className="nj2-btn nj2-btn-brand nj2-btn-sm" onClick={claim} disabled={busy}>
      {busy ? "Claiming…" : "Claim"}
    </button>
  );
}
