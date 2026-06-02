"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const MESSAGES: Record<string, string> = {
  Configuration: "There is a server configuration error.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link has expired or already been used.",
  Default: "An error occurred while signing in.",
};

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <AuthErrorInner />
    </Suspense>
  );
}

function AuthErrorInner() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";
  const message = MESSAGES[error] ?? MESSAGES.Default;

  return (
    <div className="rd-auth-shell">
      <div className="rd-auth-card">
        <div className="rd-auth-brand">
          <span className="rd-auth-brand-roof">roof</span>
          <span className="rd-auth-brand-drafts">drafts</span>
        </div>
        <h1 className="rd-auth-heading" style={{ color: "var(--nj2-danger)" }}>
          Sign-in error
        </h1>
        <p className="rd-auth-sub">{message}</p>
        <Link href="/auth/signin" className="nj2-btn nj2-btn-secondary" style={{ marginTop: 16, display: "inline-flex" }}>
          Try again
        </Link>
      </div>
    </div>
  );
}
