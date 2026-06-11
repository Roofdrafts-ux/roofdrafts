"use client";
// ════════════════════════════════════════════════════════════════
// Roofdrafts — shared UI primitives
// ════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from "react";

/* ───────── Inline lucide icon set (reliable, currentColor) ───────── */
const ICON_PATHS: Record<string, string> = {
  x: "M18 6 6 18M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  plus: "M5 12h14M12 5v14",
  minus: "M5 12h14",
  "arrow-left": "M12 19l-7-7 7-7M19 12H5",
  "map-pin":
    "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
  mail: "M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  "shield-check":
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4",
  "file-text":
    "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8",
  download: "M7 10l5 5 5-5M12 15V3",
  clock: "M12 6v6l4 2",
  target: "",
  "refresh-cw":
    "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5",
  "user-check": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 11l2 2 4-4",
  "scan-line":
    "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
  ruler:
    "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0ZM14.5 12.5l2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2",
  house:
    "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  "building-2":
    "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4",
  box: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7l8.7 5 8.7-5M12 22V12",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  layers:
    "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.84ZM2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
  satellite:
    "M13 7 9 3 5 7l4 4M17 11l4 4-4 4-4-4M8 12l4 4 6-6-4-4ZM16 8l3-3M9 21a6 6 0 0 0-6-6",
  "alert-circle": "M12 8v4M12 16h.01",
  "message-circle": "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4Z",
  "chevron-down": "m6 9 6 6 6-6",
};
const ICON_CIRCLES: Record<string, number[][]> = {
  "map-pin": [[12, 10, 3]],
  target: [
    [12, 12, 10],
    [12, 12, 6],
    [12, 12, 2],
  ],
  clock: [[12, 12, 10]],
  "user-check": [[9, 7, 4]],
  "alert-circle": [[12, 12, 10]],
};
const ICON_RECTS: Record<string, number[][]> = { mail: [[2, 4, 20, 16, 2]] };

export function Icon({
  name,
  size = 18,
  style = {},
  strokeColor,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
  strokeColor?: string;
  fill?: boolean;
}) {
  const d = ICON_PATHS[name] || "";
  const circles = ICON_CIRCLES[name] || [];
  const rects = ICON_RECTS[name] || [];
  const isStar = name === "star";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={isStar ? "currentColor" : "none"}
      stroke={strokeColor || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0, ...style }}
    >
      {isStar && (
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      )}
      {rects.map((r, i) => (
        <rect key={"r" + i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx={r[4]} />
      ))}
      {circles.map((c, i) => (
        <circle key={"c" + i} cx={c[0]} cy={c[1]} r={c[2]} />
      ))}
      {d && <path d={d} />}
    </svg>
  );
}

/* ───────── Brand mark + wordmark ─────────
   "Carpenter's square roof" mark (Higgsfield concept #3, redrawn as exact
   geometry): thick chevron band gable, clay ruler ticks etched on the right
   rafter, amber point under the apex, arrowed dimension line below.
   Keep icon.svg and apple-icon.tsx in sync with this geometry. */
export function RoofMark({ size = 30, light = false }: { size?: number; light?: boolean }) {
  const ink = light ? "var(--tp-accent)" : "#fff";
  const badge = light ? "#fff" : "var(--tp-accent)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9.3" fill={badge} />
      {/* tongue (left, hollow outline) — open path so the apex has no miter spike */}
      <path
        d="M16 6 L4.6 18.4 L6.29 18.4 L14.94 9.75"
        fill="none"
        stroke={ink}
        strokeWidth="0.7"
        strokeLinejoin="bevel"
      />
      {/* solid ruler blade (right) — covers the apex joint */}
      <path d="M16 6 L28.4 18.4 L23.59 18.4 L14.94 9.75 Z" fill={ink} />
      {/* ruler ticks etched along the blade's inner edge */}
      <path
        d="M15.63 10.44 L16.3 9.77 M16.44 11.25 L17.11 10.58 M17.25 12.06 L18.45 10.85 M18.05 12.86 L18.73 12.19 M18.86 13.67 L19.53 13.0 M19.67 14.48 L20.34 13.81 M20.48 15.29 L21.68 14.08 M21.28 16.09 L21.96 15.42 M22.09 16.9 L22.76 16.23 M22.9 17.71 L23.57 17.04"
        fill="none"
        stroke={badge}
        strokeWidth="0.42"
        strokeLinecap="round"
      />
      {/* apex point — the QA-verified signature */}
      <circle cx="15" cy="14.4" r="1.6" fill={light ? "var(--tp-accent)" : "var(--nj2-lime)"} />
      {/* dimension line: end bars + outward arrowheads */}
      <path
        d="M5.8 20.7 v3.8 M26.2 20.7 v3.8 M6.7 22.6 H25.3"
        fill="none"
        stroke={ink}
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <path d="M6.3 22.6 l3.8 -0.9 v1.8 Z M25.7 22.6 l-3.8 -0.9 v1.8 Z" fill={ink} />
    </svg>
  );
}

export function Wordmark({ light = false, size = 38 }: { light?: boolean; size?: number }) {
  return (
    <a href="#top" style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28 }}>
      <RoofMark size={size} light={light} />
      <span
        style={{
          fontFamily: "var(--nj2-font-logo)",
          fontWeight: 700,
          fontSize: size * 0.62,
          letterSpacing: "-.022em",
          color: light ? "#fff" : "var(--nj2-fg-1)",
        }}
      >
        roof
        <span style={{ color: light ? "rgba(255,255,255,.62)" : "var(--nj2-fg-3)" }}>drafts</span>
      </span>
    </a>
  );
}

/* ───────── Eyebrow ───────── */
export function Eyebrow({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="tp-eyebrow" style={style}>
      <span className="tp-tick" />
      {children}
    </div>
  );
}

/* ───────── reveal-on-scroll wrapper (with guaranteed fallback) ───────── */
export function Reveal({
  children,
  delay = 0,
  style = {},
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const show = () => {
      if (!done) {
        done = true;
        el.classList.add("tp-in");
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show();
            io.disconnect();
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) show();
    });
    const t = setTimeout(show, 1400 + delay);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [delay]);
  const El = as as React.ElementType;
  return (
    <El ref={ref} className="tp-reveal" style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </El>
  );
}
