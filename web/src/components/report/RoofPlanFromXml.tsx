// Renders an AppliCad roof export as a top-down measured plan (SVG).
// Server-safe: pure JSX, no hooks. Colors extend the paper palette used by
// the marketing RoofPlan renderer so reports and site share one language.
import React from "react";
import {
  type AppliRoof,
  loopToPolygon,
  planBounds,
  EDGE_ROWS,
} from "@/lib/applicad";

export const REPORT_LINE_STYLE: Record<
  string,
  { color: string; width: number; dash?: string }
> = {
  EAVE: { color: "#2A6076", width: 2.2 },
  RAKE: { color: "#3C7A52", width: 1.7 },
  RIDGE: { color: "#C2603A", width: 2.4 },
  HIP: { color: "#B7791F", width: 2.2 },
  VALLEY: { color: "#B23A2E", width: 1.9, dash: "5 3" },
  STEP: { color: "#2F8F83", width: 1.6, dash: "2.5 2.5" },
  APRON: { color: "#A14BB3", width: 1.6 },
  "BOX-GUTTER": { color: "#5B6B9E", width: 1.8, dash: "7 3" },
};

export function RoofPlanFromXml({
  roof,
  padding = 26,
}: {
  roof: AppliRoof;
  padding?: number;
}) {
  const b = planBounds(roof);
  const wFt = b.maxX - b.minX;
  const hFt = b.maxY - b.minY;
  const VBW = 520;
  const drawW = VBW - padding * 2;
  const scale = drawW / wFt;
  const VBH = hFt * scale + padding * 2;
  const px = (x: number) => padding + (x - b.minX) * scale;
  const py = (y: number) => padding + (b.maxY - y) * scale; // plan-north up

  // One path per face, all loops in it, evenodd → dormer holes punch out.
  const facePaths = roof.faces.map((f) => {
    const d = f.loops
      .map((loop) => {
        const poly = loopToPolygon(loop, roof);
        if (poly.length < 3) return "";
        return (
          "M" +
          poly.map(([x, y]) => `${px(x).toFixed(2)},${py(y).toFixed(2)}`).join("L") +
          "Z"
        );
      })
      .join(" ");
    return { id: f.id, d };
  });

  const present = new Set(
    Object.values(roof.lines)
      .filter((l) => l.type !== "NONE")
      .map((l) => l.type)
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${VBW} ${Math.round(VBH)}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label="Measured roof plan, top-down"
      >
        {facePaths.map((f) => (
          <path
            key={f.id}
            d={f.d}
            fill="rgba(42,96,118,.05)"
            fillRule="evenodd"
            stroke="rgba(42,96,118,.18)"
            strokeWidth="0.5"
          />
        ))}
        {Object.values(roof.lines).map((ln) => {
          const style = REPORT_LINE_STYLE[ln.type];
          if (!style) return null;
          const a = roof.points[ln.a];
          const c = roof.points[ln.b];
          if (!a || !c) return null;
          return (
            <line
              key={ln.id}
              x1={px(a.x)}
              y1={py(a.y)}
              x2={px(c.x)}
              y2={py(c.y)}
              stroke={style.color}
              strokeWidth={style.width}
              strokeLinecap="round"
              strokeDasharray={style.dash}
            />
          );
        })}
        {/* north arrow */}
        <g transform={`translate(${VBW - 20},${22})`}>
          <circle r="11" fill="none" stroke="#7C7159" strokeOpacity="0.5" strokeWidth="0.8" />
          <path d="M0,-6.5 L2.6,3.2 L0,1.1 L-2.6,3.2 Z" fill="#1C4A5C" />
          <text y="-13" textAnchor="middle" fontFamily="var(--nj2-font-mono)" fontSize="8" fill="#7C7159">
            N
          </text>
        </g>
      </svg>

      {/* legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 14px",
          marginTop: 12,
          justifyContent: "center",
        }}
      >
        {EDGE_ROWS.filter(([type]) => present.has(type)).map(([type, label]) => {
          const s = REPORT_LINE_STYLE[type];
          return (
            <span
              key={type}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--nj2-font-mono)",
                fontSize: 10,
                color: "#7C7159",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 0,
                  borderTop: `2.5px ${s.dash ? "dashed" : "solid"} ${s.color}`,
                }}
              />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
