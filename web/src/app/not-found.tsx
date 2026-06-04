import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--nj2-font-body, system-ui)", textAlign: "center", padding: 24 }}>
      <div>
        <div style={{ fontFamily: "var(--nj2-font-logo, system-ui)", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
          roof<span style={{ color: "var(--nj2-fg-3, #888)" }}>drafts</span>
        </div>
        <h1 style={{ fontSize: 28, margin: "8px 0" }}>Page not found</h1>
        <p style={{ color: "var(--nj2-fg-3, #777)", marginBottom: 20 }}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className="nj2-btn nj2-btn-brand">Back to home</Link>
      </div>
    </div>
  );
}
