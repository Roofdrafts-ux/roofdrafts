"use client";
// ════════════════════════════════════════════════════════════════
// Roofdrafts — RENDERER: draws the plan FROM a computed model
// ════════════════════════════════════════════════════════════════
import React, { useMemo } from "react";
import {
  computeRoof,
  commas,
  ftIn,
  LINE_TYPES,
  LINE_LABEL,
  LINE_PALETTE,
  LINE_WIDTH,
  LINE_DASH,
  MODEL_CROSS_GABLE,
  MODEL_GABLE,
  MODEL_COMMERCIAL,
  type RoofModel,
  type LineType,
} from "@/lib/roofcalc";

function DimAxis({
  x1,
  y1,
  x2,
  y2,
  label,
  color,
  horizontal = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  color: string;
  horizontal?: boolean;
}) {
  const mx = (x1 + x2) / 2,
    my = (y1 + y2) / 2;
  const t = 4;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.7" />
      {horizontal ? (
        <>
          <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} stroke={color} strokeWidth="0.7" />
          <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} stroke={color} strokeWidth="0.7" />
          <g transform={`translate(${mx},${my + 12})`}>
            <rect x="-20" y="-9" width="40" height="13" rx="2" fill="var(--nj2-bg-card)" opacity="0.0" />
            <text
              textAnchor="middle"
              fontFamily="var(--nj2-font-mono)"
              fontSize="9.5"
              fontWeight="500"
              fill={color}
            >
              {label}
            </text>
          </g>
        </>
      ) : (
        <>
          <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} stroke={color} strokeWidth="0.7" />
          <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} stroke={color} strokeWidth="0.7" />
          <g transform={`translate(${mx + 9},${my}) rotate(-90)`}>
            <text
              textAnchor="middle"
              fontFamily="var(--nj2-font-mono)"
              fontSize="9.5"
              fontWeight="500"
              fill={color}
            >
              {label}
            </text>
          </g>
        </>
      )}
    </g>
  );
}

export function RoofPlanReport({
  model,
  mode = "paper",
  animate = false,
  showFacetLabels = true,
  showLegend = true,
  padding = 46,
}: {
  model: RoofModel;
  mode?: "paper" | "blueprint";
  animate?: boolean;
  showFacetLabels?: boolean;
  showLegend?: boolean;
  padding?: number;
}) {
  const m = useMemo(() => computeRoof(model), [model]);
  const pal = LINE_PALETTE[mode];

  // bounds
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  Object.values(model.v).forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  const wFt = maxX - minX,
    hFt = maxY - minY;
  const VBW = 520,
    drawW = VBW - padding * 2;
  const scale = drawW / wFt;
  const VBH = hFt * scale + padding * 2;
  const px = (x: number) => padding + (x - minX) * scale;
  const py = (y: number) => padding + (maxY - y) * scale;

  const dash: React.CSSProperties = animate
    ? {
        strokeDasharray: 1400,
        strokeDashoffset: 1400,
        animation: "tpDraw 1.7s var(--nj2-ease) .15s forwards",
      }
    : {};
  const present = LINE_TYPES.filter((t) => m.byType[t] > 0.5);

  return (
    <div>
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label={`Measured roof plan — ${Math.round(m.totalArea)} square feet`}
      >
        {/* facet fills */}
        {m.facets.map((f) => (
          <polygon
            key={"f" + f.id}
            points={f.pts.map((p) => `${px(p[0])},${py(p[1])}`).join(" ")}
            fill={pal.facet}
            stroke={pal.eave}
            strokeOpacity="0.18"
            strokeWidth="0.5"
          />
        ))}
        {/* edges, color-coded by type */}
        {model.edges.map((e, i) => {
          const A = model.v[e.a],
            B = model.v[e.b];
          return (
            <line
              key={"e" + i}
              x1={px(A[0])}
              y1={py(A[1])}
              x2={px(B[0])}
              y2={py(B[1])}
              stroke={pal[e.type]}
              strokeWidth={LINE_WIDTH[e.type]}
              strokeLinecap="round"
              strokeDasharray={LINE_DASH[e.type]}
              style={LINE_DASH[e.type] ? {} : dash}
            />
          );
        })}
        {/* per-facet pitch + area labels */}
        {showFacetLabels &&
          m.facets.map((f) => {
            const cx = px(f.c[0]),
              cy = py(f.c[1]);
            return (
              <g key={"l" + f.id} transform={`translate(${cx},${cy})`} style={{ pointerEvents: "none" }}>
                <path d="M-9,4 L6,4 L6,-4 Z" fill="none" stroke={pal.key} strokeWidth="1.1" />
                <text
                  x="10"
                  y="3.5"
                  fontFamily="var(--nj2-font-mono)"
                  fontWeight="600"
                  fontSize="9.5"
                  fill={pal.key}
                >
                  {Math.round(f.pitch)}/12
                </text>
                <text x="-9" y="17" fontFamily="var(--nj2-font-mono)" fontSize="8.5" fill={pal.dim}>
                  {commas(Math.round(f.area))} ft²
                </text>
              </g>
            );
          })}
        {/* overall dimensions */}
        <DimAxis
          x1={px(minX)}
          y1={py(minY) + 22}
          x2={px(maxX)}
          y2={py(minY) + 22}
          label={ftIn(wFt)}
          color={pal.dim}
          horizontal
        />
        <DimAxis
          x1={px(maxX) + 22}
          y1={py(maxY)}
          x2={px(maxX) + 22}
          y2={py(minY)}
          label={ftIn(hFt)}
          color={pal.dim}
        />
        {/* north arrow */}
        <g transform={`translate(${VBW - 24},${28})`}>
          <circle r="12" fill="none" stroke={pal.dim} strokeOpacity="0.5" strokeWidth="0.8" />
          <path d="M0,-7 L2.8,3.5 L0,1.2 L-2.8,3.5 Z" fill={pal.label} />
          <text y="-14" textAnchor="middle" fontFamily="var(--nj2-font-mono)" fontSize="8" fill={pal.dim}>
            N
          </text>
        </g>
      </svg>

      {showLegend && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 14px",
            marginTop: 10,
            justifyContent: "center",
          }}
        >
          {present.map((t: LineType) => (
            <span
              key={t}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--nj2-font-mono)",
                fontSize: 10,
                color: pal.dim,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 0,
                  borderTop: `2.5px ${t === "valley" ? "dashed" : "solid"} ${pal[t]}`,
                }}
              />
              {LINE_LABEL[t]}{" "}
              <span style={{ color: pal.label, fontWeight: 600 }}>{Math.round(m.byType[t])}′</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- backwards-compatible wrappers used across the site ---------- */
export function RoofPlanHero({ animate = true }: { animate?: boolean }) {
  return (
    <RoofPlanReport
      model={MODEL_CROSS_GABLE}
      mode="blueprint"
      animate={animate}
      showLegend={true}
      showFacetLabels={true}
    />
  );
}

/* 3D ESX wall diagram — isometric walls + roof wireframe (paper palette) */
export function WallDiagram3D() {
  const pal = LINE_PALETTE.paper;
  // 36×24 ft footprint, 10 ft walls, 17 ft ridge, projected to isometric
  const wall = pal.label;
  return (
    <svg
      viewBox="16 84 368 268"
      width="100%"
      style={{ display: "block", overflow: "visible" }}
      role="img"
      aria-label="3D wall and roof wireframe diagram"
    >
      {/* roof + front wall plane fills */}
      <polygon points="165,270 352,176 290,103 103,197" fill={pal.facet} />
      <polygon points="165,330 352,236 352,176 165,270" fill={pal.facet} />
      <polygon points="165,330 165,270 40,208 40,268" fill={pal.facet} />
      {/* hidden base edges */}
      <g stroke={wall} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.3">
        <line x1="352" y1="236" x2="227" y2="174" />
        <line x1="227" y1="174" x2="40" y2="268" />
        <line x1="227" y1="174" x2="227" y2="114" />
      </g>
      {/* siding courses on front wall */}
      <g stroke={wall} strokeWidth="1" opacity="0.18">
        <line x1="165" y1="318" x2="352" y2="224" />
        <line x1="165" y1="306" x2="352" y2="212" />
        <line x1="165" y1="294" x2="352" y2="200" />
        <line x1="165" y1="282" x2="352" y2="188" />
      </g>
      {/* walls — verticals + visible base + top plates */}
      <g stroke={wall} strokeWidth="1.5" strokeLinecap="round" fill="none">
        <line x1="165" y1="330" x2="165" y2="270" />
        <line x1="352" y1="236" x2="352" y2="176" />
        <line x1="40" y1="268" x2="40" y2="208" />
        <line x1="165" y1="330" x2="352" y2="236" />
        <line x1="165" y1="330" x2="40" y2="268" />
      </g>
      {/* eaves */}
      <g stroke={pal.eave} strokeWidth="2.2" strokeLinecap="round">
        <line x1="165" y1="270" x2="352" y2="176" />
        <line x1="40" y1="208" x2="227" y2="114" />
      </g>
      {/* rakes — gable ends */}
      <g stroke={pal.rake} strokeWidth="1.7" strokeLinecap="round">
        <line x1="165" y1="270" x2="103" y2="197" />
        <line x1="103" y1="197" x2="40" y2="208" />
        <line x1="352" y1="176" x2="290" y2="103" />
        <line x1="290" y1="103" x2="227" y2="114" />
      </g>
      {/* ridge */}
      <line x1="103" y1="197" x2="290" y2="103" stroke={pal.ridge} strokeWidth="2.4" strokeLinecap="round" />
      {/* wall-height dimension */}
      <g stroke={pal.dim} strokeWidth="0.7">
        <line x1="26" y1="208" x2="26" y2="268" />
        <line x1="22" y1="208" x2="30" y2="208" />
        <line x1="22" y1="268" x2="30" y2="268" />
      </g>
      <g transform="translate(19,238) rotate(-90)">
        <text textAnchor="middle" fontFamily="var(--nj2-font-mono)" fontSize="9.5" fontWeight="500" fill={pal.dim}>
          10′ 0″
        </text>
      </g>
    </svg>
  );
}

export function RoofPlanCompact({
  animate = false,
  mode = "paper",
  showLegend = false,
  variant = "residential",
}: {
  pitch?: string;
  animate?: boolean | string;
  mode?: "paper" | "blueprint";
  showLegend?: boolean;
  variant?: "residential" | "commercial" | "wall3d";
}) {
  if (variant === "wall3d") return <WallDiagram3D />;
  return (
    <RoofPlanReport
      model={variant === "commercial" ? MODEL_COMMERCIAL : MODEL_GABLE}
      mode={mode}
      animate={!!animate}
      showLegend={showLegend}
      showFacetLabels={false}
      padding={34}
    />
  );
}
