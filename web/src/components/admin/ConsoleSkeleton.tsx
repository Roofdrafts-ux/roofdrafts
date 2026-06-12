// Shared streamed-loading skeleton for the admin/dashboard/estimator shells.
// Mirrors the real layout (header bar + KPI row + table) so the page doesn't
// jump when data resolves.
export function ConsoleSkeleton({ kpis = 4, rows = 6 }: { kpis?: number; rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading…"
      style={{ minHeight: "100vh", background: "var(--nj2-bg-page)", fontFamily: "var(--nj2-font-body)" }}
    >
      <div style={{ borderBottom: "1px solid var(--nj2-border)", background: "var(--nj2-bg-sunken)" }}>
        <div style={{ maxWidth: "none", padding: "14px 36px", display: "flex", alignItems: "center", gap: 16 }}>
          <div className="rd-skel" style={{ width: 130, height: 26 }} />
          <div style={{ flex: 1 }} />
          <div className="rd-skel" style={{ width: 90, height: 20 }} />
        </div>
      </div>
      <div style={{ maxWidth: "none", padding: "32px 36px" }}>
        <div className="rd-skel" style={{ width: 180, height: 28, marginBottom: 22 }} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpis}, 1fr)`, gap: 14, marginBottom: 30 }}>
          {Array.from({ length: kpis }).map((_, i) => (
            <div key={i} className="rd-skel" style={{ height: 96 }} />
          ))}
        </div>
        <div className="rd-skel" style={{ height: 44, marginBottom: 2, borderRadius: "12px 12px 0 0" }} />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rd-skel" style={{ height: 52, marginBottom: 2, opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    </div>
  );
}
