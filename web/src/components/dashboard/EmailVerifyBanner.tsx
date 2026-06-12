"use client";

import { useState } from "react";

/** Dismissible-by-action "confirm your email" prompt for unverified accounts. */
export function EmailVerifyBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function resend() {
    setState("sending");
    await fetch("/api/account/resend-verification", { method: "POST" }).catch(() => {});
    setState("sent");
  }

  return (
    <div
      style={{
        border: "1.5px solid color-mix(in srgb, var(--nj2-warning,#B7791F) 45%, transparent)",
        background: "var(--nj2-warning-soft,#FBF1DD)",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 13.5, color: "var(--nj2-fg-1,#1c1b18)", flex: 1, minWidth: 220 }}>
        {state === "sent" ? (
          <>Confirmation sent to <b>{email}</b>. Check your inbox (and spam).</>
        ) : (
          <>Confirm your email (<b>{email}</b>) so we can deliver reports and order updates.</>
        )}
      </span>
      {state !== "sent" && (
        <button
          type="button"
          onClick={resend}
          disabled={state === "sending"}
          className="nj2-btn nj2-btn-sm"
          style={{ border: "1px solid var(--nj2-warning,#B7791F)", color: "var(--nj2-warning,#B7791F)", background: "transparent" }}
        >
          {state === "sending" ? "Sending…" : "Resend link"}
        </button>
      )}
    </div>
  );
}
