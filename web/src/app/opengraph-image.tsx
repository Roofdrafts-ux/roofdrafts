import { ImageResponse } from "next/og";

// Branded social share card (used for link previews on Slack, iMessage, X, etc.)
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Roofdrafts — accurate roof diagrams, delivered fast";

const CLAY = "#BE5630";
const AMBER = "#E8B23A";
const INK = "#1C1B18";
const PAPER = "#FAF6EE";
const MUTED = "#8A8475";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          backgroundImage:
            "linear-gradient(rgba(190,86,48,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(190,86,48,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="76" height="76" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9.3" fill={CLAY} />
            <path d="M16 6 L4.6 18.4 L6.29 18.4 L14.94 9.75" fill="none" stroke="#fff" strokeWidth="0.7" />
            <path d="M16 6 L28.4 18.4 L23.59 18.4 L14.94 9.75 Z" fill="#fff" />
            <circle cx="15" cy="14.4" r="1.6" fill={AMBER} />
            <path d="M5.8 20.7 v3.8 M26.2 20.7 v3.8 M6.7 22.6 H25.3" fill="none" stroke="#fff" strokeWidth="0.95" />
            <path d="M6.3 22.6 l3.8 -0.9 v1.8 Z M25.7 22.6 l-3.8 -0.9 v1.8 Z" fill="#fff" />
          </svg>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: INK }}>roof</span>
            <span style={{ color: MUTED }}>drafts</span>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: 940 }}>
            <span style={{ color: INK }}>Accurate roof diagrams,</span>
            <span style={{ color: CLAY }}>delivered before lunch.</span>
          </div>
          <div style={{ fontSize: 28, color: "#585041", maxWidth: 900, lineHeight: 1.4 }}>
            Human-verified area, squares, pitch and line lengths — PDF, Xactimate ESX and XML in 6–10 hours.
          </div>
        </div>

        {/* footer chips */}
        <div style={{ display: "flex", gap: 16, fontSize: 22, color: MUTED }}>
          <span>±2% accuracy guarantee</span>
          <span style={{ color: "#C9BFA8" }}>·</span>
          <span>50-state coverage</span>
          <span style={{ color: "#C9BFA8" }}>·</span>
          <span>roofdrafts.com</span>
        </div>
      </div>
    ),
    size
  );
}
