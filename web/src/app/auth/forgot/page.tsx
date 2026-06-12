"use client";

import { useState } from "react";
import Link from "next/link";
import { RoofMark } from "@/components/primitives";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Endpoint is enumeration-safe and always succeeds; show the same
    // confirmation regardless so we never reveal whether the email exists.
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="rd-auth-shell">
      <div className="rd-auth-card">
        <div className="rd-auth-brand">
          <RoofMark size={30} />
          <span className="rd-auth-brand-roof">roof</span>
          <span className="rd-auth-brand-drafts">drafts</span>
        </div>

        {sent ? (
          <>
            <h1 className="rd-auth-heading">Check your email</h1>
            <p className="rd-auth-sub">
              If an account exists for <b>{email}</b>, a password reset link is on its way. It expires
              in one hour.
            </p>
            <Link href="/auth/signin" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" style={{ marginTop: 8 }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="rd-auth-heading">Reset your password</h1>
            <p className="rd-auth-sub">Enter your email and we&apos;ll send you a link to choose a new one.</p>
            <form onSubmit={handleSubmit} className="rd-auth-form">
              <label className="rd-field">
                <span className="rd-field-label">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rd-input"
                  placeholder="you@company.com"
                />
              </label>
              <button type="submit" className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="rd-auth-footer">
              Remembered it? <Link href="/auth/signin" className="rd-auth-link">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
