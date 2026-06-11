// Pure display helpers shared by the admin console (server pages and client
// components alike — keep this file dependency-free).

/** "3h ago", "2d ago", "just now" — compact relative time for tables. */
export function relTime(d: Date | string, now: Date = new Date()): string {
  const t = typeof d === "string" ? new Date(d) : d;
  const s = Math.round((now.getTime() - t.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  const w = Math.round(days / 7);
  if (w < 5) return `${w}w ago`;
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Cents → "$30" / "$1,234.50" (drops cents when whole). */
export function fmtUsd(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const d = cents / 100;
  return d % 1 === 0
    ? `$${d.toLocaleString("en-US")}`
    : `$${d.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Report type → label + chip class (colors echo the diagram line palette). */
export function typeMeta(reportType: string): { label: string; cls: string } {
  switch (reportType) {
    case "commercial": return { label: "COM", cls: "rd-type-com" };
    case "3d-esx": return { label: "3D", cls: "rd-type-3d" };
    default: return { label: "RES", cls: "rd-type-res" };
  }
}

/** "Tara Whitfield" → "TW"; falls back to the email's first letter. */
export function initials(name: string | null | undefined, email?: string | null): string {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

/** Stable avatar color bucket (0..5) from any identity string. */
export function avatarBucket(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % 6;
}
