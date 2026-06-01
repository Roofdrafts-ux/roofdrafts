import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="rd-auth-shell">
      <div className="rd-auth-card" style={{ textAlign: "center" }}>
        <div className="rd-auth-brand">
          <span className="rd-auth-brand-roof">roof</span>
          <span className="rd-auth-brand-drafts">drafts</span>
        </div>
        <h1 className="rd-auth-heading">Access denied</h1>
        <p className="rd-auth-sub">
          You don't have permission to view that page.
        </p>
        <Link href="/dashboard" className="nj2-btn nj2-btn-secondary" style={{ marginTop: 16, display: "inline-flex" }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
