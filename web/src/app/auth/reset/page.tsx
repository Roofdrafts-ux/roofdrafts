"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RoofMark } from "@/components/primitives";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Couldn't reset your password.");
    }
  }

  return (
    <div className="rd-auth-shell">
      <div className="rd-auth-card">
        <div className="rd-auth-brand">
          <RoofMark size={30} />
          <span className="rd-auth-brand-roof">roof</span>
          <span className="rd-auth-brand-drafts">drafts</span>
        </div>

        {done ? (
          <>
            <h1 className="rd-auth-heading">Password updated</h1>
            <p className="rd-auth-sub">You can now sign in with your new password.</p>
            <Link href="/auth/signin" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" style={{ marginTop: 8 }}>
              Sign in
            </Link>
          </>
        ) : !token ? (
          <>
            <h1 className="rd-auth-heading">Invalid link</h1>
            <p className="rd-auth-sub">This reset link is missing its token. Request a fresh one.</p>
            <Link href="/auth/forgot" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" style={{ marginTop: 8 }}>
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <h1 className="rd-auth-heading">Choose a new password</h1>
            <p className="rd-auth-sub">Make it at least 8 characters.</p>
            <form onSubmit={handleSubmit} className="rd-auth-form">
              <label className="rd-field">
                <span className="rd-field-label">New password</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rd-input"
                  placeholder="••••••••"
                />
              </label>
              <label className="rd-field">
                <span className="rd-field-label">Confirm new password</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="rd-input"
                  placeholder="••••••••"
                />
              </label>
              {error && <p className="rd-auth-error">{error}</p>}
              <button type="submit" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
