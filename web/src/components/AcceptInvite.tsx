"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function accept() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/org/invitations/${token}/accept`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "Could not accept the invitation.");
      setBusy(false);
      return;
    }
    if (data.organizationId) {
      await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: data.organizationId }),
      });
    }
    router.push("/dashboard/team");
  }

  return (
    <div>
      <button type="button" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" disabled={busy} onClick={accept}>
        {busy ? "Joining…" : "Accept & join"}
      </button>
      {err && <p className="rd-auth-error" style={{ marginTop: 10 }}>{err}</p>}
    </div>
  );
}
