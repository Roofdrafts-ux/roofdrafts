"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RoofMark } from "@/components/primitives";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"pending" | "ok" | "error">("pending");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React StrictMode double-invoke
    ran.current = true;
    if (!token) {
      setState("error");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => setState(r.ok ? "ok" : "error"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <div className="rd-auth-shell">
      <div className="rd-auth-card">
        <div className="rd-auth-brand">
          <RoofMark size={30} />
          <span className="rd-auth-brand-roof">roof</span>
          <span className="rd-auth-brand-drafts">drafts</span>
        </div>

        {state === "pending" && (
          <>
            <h1 className="rd-auth-heading">Confirming your email…</h1>
            <p className="rd-auth-sub">One moment.</p>
          </>
        )}
        {state === "ok" && (
          <>
            <h1 className="rd-auth-heading">Email confirmed</h1>
            <p className="rd-auth-sub">Thanks — your email is verified. You&apos;re all set.</p>
            <Link href="/go" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" style={{ marginTop: 8 }}>
              Continue
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="rd-auth-heading">Link expired</h1>
            <p className="rd-auth-sub">
              This confirmation link is invalid or has expired. You can request a fresh one from your
              account page after signing in.
            </p>
            <Link href="/auth/signin" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" style={{ marginTop: 8 }}>
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
