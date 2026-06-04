"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to server logs (and any future error-tracking integration).
    console.error("[app error]", error?.digest ?? "", error?.message);
  }, [error]);

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--nj2-font-body, system-ui)", textAlign: "center", padding: 24 }}>
      <div>
        <div style={{ fontFamily: "var(--nj2-font-logo, system-ui)", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
          roof<span style={{ color: "var(--nj2-fg-3, #888)" }}>drafts</span>
        </div>
        <h1 style={{ fontSize: 26, margin: "8px 0" }}>Something went wrong</h1>
        <p style={{ color: "var(--nj2-fg-3, #777)", marginBottom: 20 }}>
          An unexpected error occurred. You can retry, or head back home.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={reset} className="nj2-btn nj2-btn-brand">Try again</button>
          <a href="/" className="nj2-btn" style={{ border: "1px solid var(--nj2-border-subtle,#d8d2c7)" }}>Home</a>
        </div>
        {error?.digest && <p style={{ color: "#aaa", fontSize: 12, marginTop: 16 }}>Ref: {error.digest}</p>}
      </div>
    </div>
  );
}
