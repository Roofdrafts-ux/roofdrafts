"use client";
// ════════════════════════════════════════════════════════════════
// Roofdrafts — ESTIMATOR MEASURE TOOL
// Trace / edit a roof model over (mock) aerial imagery. Every edit
// recomputes the geometry via the same engine the report uses, and
// the diagram is rendered FROM the model — so the picture and the
// numbers can never disagree.
//
// SEAMS (later phases, intentionally not wired here):
//  · Persistence  → Phase 3+: save RoofModel to Postgres via Prisma,
//                   tied to an Order + estimator.
//  · Auth / RBAC  → this surface is estimator-only; route guard +
//                   server-side role check land with Auth.js.
//  · Deliverables → Phase 5: PDF / Xactimate ESX / XML exporters read
//                   the same computed model.
//  · Imagery      → real Nearmap/Vexcel/Google/EagleView raster swaps
//                   in behind ImageryProvider; mock must never ship.
// ════════════════════════════════════════════════════════════════
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  computeRoof,
  dist3D,
  commas,
  ftIn,
  MODEL_CROSS_GABLE,
  MODEL_GABLE,
  LINE_TYPES,
  LINE_LABEL,
  LINE_PALETTE,
  LINE_WIDTH,
  LINE_DASH,
  type RoofModel,
  type LineType,
  type Vec3,
} from "@/lib/roofcalc";
import { RoofPlanReport } from "@/components/RoofPlan";
import { getImageryProvider, type ImageryScene } from "@/lib/imagery";
import { Icon } from "@/components/primitives";

/* ---------- canvas geometry ---------- */
const VBW = 760;
const VBH = 540;
const PAD = 70;
const SNAP = 0.25; // feet
const snap = (n: number) => Math.round(n / SNAP) * SNAP;

type Sel = { kind: "vertex"; id: string } | { kind: "edge"; index: number } | null;
interface Frame {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const TEMPLATES: Record<string, { label: string; model: RoofModel }> = {
  cross: { label: "Cross-gable", model: MODEL_CROSS_GABLE },
  gable: { label: "Simple gable", model: MODEL_GABLE },
};

function cloneModel(m: RoofModel): RoofModel {
  return {
    name: m.name,
    v: Object.fromEntries(Object.entries(m.v).map(([k, p]) => [k, [...p] as Vec3])),
    facets: m.facets.map((f) => ({ id: f.id, verts: [...f.verts] })),
    edges: m.edges.map((e) => ({ ...e })),
  };
}

function frameOf(m: RoofModel, margin = 14): Frame {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  Object.values(m.v).forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX: minX - margin, maxX: maxX + margin, minY: minY - margin, maxY: maxY + margin };
}

/* seeded RNG so the mock aerial backdrop is stable per address */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function MeasureTool({
  orderId,
  orderDisplayId,
  orderAddress,
}: {
  orderId?: string;
  orderDisplayId?: string;
  orderAddress?: string;
} = {}) {
  const [model, setModel] = useState<RoofModel>(() => cloneModel(MODEL_CROSS_GABLE));
  const [frame, setFrame] = useState<Frame>(() => frameOf(MODEL_CROSS_GABLE));
  const [sel, setSel] = useState<Sel>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [scene, setScene] = useState<ImageryScene | null>(null);
  const [address, setAddress] = useState(orderAddress ?? "1490 Junction Ave, San Jose, CA");
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"paper" | "blueprint">("blueprint");
  const [showImagery, setShowImagery] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  // generated client-side after mount so the static prerender + hydration agree
  const [reportId, setReportId] = useState("RD-—");
  useEffect(() => {
    setReportId("RD-" + Math.floor(48000 + Math.random() * 1900));
  }, []);

  const m = useMemo(() => computeRoof(model), [model]);

  /* ---------- projection (stable per frame) ---------- */
  const proj = useMemo(() => {
    const fw = frame.maxX - frame.minX || 1;
    const fh = frame.maxY - frame.minY || 1;
    const scale = Math.min((VBW - PAD * 2) / fw, (VBH - PAD * 2) / fh);
    const ox = (VBW - fw * scale) / 2;
    const oy = (VBH - fh * scale) / 2;
    return {
      scale,
      px: (x: number) => ox + (x - frame.minX) * scale,
      py: (y: number) => oy + (frame.maxY - y) * scale,
      fx: (sx: number) => frame.minX + (sx - ox) / scale,
      fy: (sy: number) => frame.maxY - (sy - oy) / scale,
    };
  }, [frame]);

  /* ---------- load imagery ---------- */
  const loadScene = useCallback(async (addr: string) => {
    if (!addr.trim()) return;
    setLoading(true);
    try {
      const s = await getImageryProvider().fetchScene(addr);
      setScene(s);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadScene(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- mock backdrop (memo by seed) ---------- */
  const backdrop = useMemo(() => {
    if (!scene) return null;
    const r = mulberry32(scene.seed);
    const blocks = Array.from({ length: 26 }, () => ({
      x: r() * VBW,
      y: r() * VBH,
      w: 24 + r() * 70,
      h: 20 + r() * 56,
      rot: (r() - 0.5) * 18,
      tone: r(),
    }));
    const trees = Array.from({ length: 22 }, () => ({
      x: r() * VBW,
      y: r() * VBH,
      rad: 6 + r() * 12,
    }));
    return { blocks, trees };
  }, [scene]);

  /* ---------- pointer handling ---------- */
  const toFeet = (clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = pt.matrixTransform(ctm.inverse());
    return [proj.fx(loc.x), proj.fy(loc.y)];
  };

  const onVertexDown = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSel({ kind: "vertex", id });
    setDragId(id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    const f = toFeet(e.clientX, e.clientY);
    if (!f) return;
    setModel((prev) => {
      const next = cloneModel(prev);
      const z = next.v[dragId][2];
      next.v[dragId] = [snap(f[0]), snap(f[1]), z];
      return next;
    });
  };
  const onPointerUp = () => setDragId(null);

  /* ---------- editing actions ---------- */
  const nudgeVertex = (id: string, axis: 0 | 1 | 2, d: number) =>
    setModel((prev) => {
      const next = cloneModel(prev);
      const p = next.v[id];
      p[axis] = Math.round((p[axis] + d) * 100) / 100;
      next.v[id] = p;
      return next;
    });
  const setEdgeType = (index: number, type: LineType) =>
    setModel((prev) => {
      const next = cloneModel(prev);
      next.edges[index] = { ...next.edges[index], type };
      return next;
    });
  const loadTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (!t) return;
    setModel(cloneModel(t.model));
    setFrame(frameOf(t.model));
    setSel(null);
  };
  const refit = () => setFrame(frameOf(model));

  /* ---------- persist model to the order (estimator) ---------- */
  const saveModel = useCallback(async () => {
    if (!orderId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/roof-model`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalSqFt: m.totalArea,
          squares: m.squares,
          predominantPitch: m.predominantPitch,
          byType: m.byType,
          facets: m.facets.map((f) => ({
            id: f.id,
            pitch: f.pitch,
            planArea: f.planArea,
            area: f.area,
          })),
          modelData: model,
          // Mock imagery → model is mock and must never be delivered as real.
          isMock: scene?.isMock ?? true,
        }),
      });
      if (res.ok) {
        setSaveMsg({
          ok: true,
          text: scene?.isMock
            ? "Saved — flagged MOCK (cannot be delivered)."
            : "Saved to order.",
        });
      } else {
        const d = await res.json().catch(() => ({}));
        setSaveMsg({ ok: false, text: d.error ?? "Save failed." });
      }
    } catch {
      setSaveMsg({ ok: false, text: "Network error while saving." });
    } finally {
      setSaving(false);
    }
  }, [orderId, m, model, scene]);

  const pal = LINE_PALETTE.paper;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 22px 80px" }}>
      <Header
        reportId={reportId}
        address={address}
        setAddress={setAddress}
        loading={loading}
        onSearch={() => loadScene(address)}
      />

      {scene?.isMock && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            margin: "14px 0 0",
            padding: "9px 14px",
            borderRadius: 10,
            background: "var(--tp-accent-soft)",
            border: "1px solid var(--tp-accent-ring)",
            color: "var(--tp-accent-600)",
            fontFamily: "var(--nj2-font-body)",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <Icon name="alert-circle" size={15} />
          MOCK IMAGERY ({scene.provider}) — for development only. A report traced over mock
          imagery must never be delivered.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.55fr) minmax(280px,1fr)",
          gap: 20,
          marginTop: 16,
          alignItems: "start",
        }}
      >
        {/* ── trace canvas ── */}
        <div className="tp-card" style={{ padding: 0, overflow: "hidden" }}>
          <Toolbar
            onTemplate={loadTemplate}
            onRefit={refit}
            showImagery={showImagery}
            setShowImagery={setShowImagery}
            scene={scene}
          />
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBW} ${VBH}`}
            width="100%"
            style={{ display: "block", touchAction: "none", cursor: dragId ? "grabbing" : "default" }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onPointerDown={() => setSel(null)}
          >
            {/* aerial backdrop (mock) */}
            <rect x="0" y="0" width={VBW} height={VBH} fill="#5b6b54" />
            {showImagery && backdrop && (
              <g opacity="0.9">
                {backdrop.blocks.map((b, i) => (
                  <rect
                    key={"b" + i}
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx="2"
                    transform={`rotate(${b.rot} ${b.x + b.w / 2} ${b.y + b.h / 2})`}
                    fill={`hsl(${28 + b.tone * 14},${14 + b.tone * 18}%,${38 + b.tone * 26}%)`}
                  />
                ))}
                {backdrop.trees.map((t, i) => (
                  <circle key={"t" + i} cx={t.x} cy={t.y} r={t.rad} fill="#3f5238" opacity="0.7" />
                ))}
              </g>
            )}
            {!showImagery && <rect x="0" y="0" width={VBW} height={VBH} fill="var(--nj2-bg-card)" />}
            {/* darkening scrim so the overlay reads clearly */}
            {showImagery && <rect x="0" y="0" width={VBW} height={VBH} fill="#0E2A38" opacity="0.32" />}

            {/* facet fills */}
            {m.facets.map((f) => (
              <polygon
                key={"f" + f.id}
                points={f.pts.map((p) => `${proj.px(p[0])},${proj.py(p[1])}`).join(" ")}
                fill="rgba(190,86,48,.14)"
                stroke="rgba(255,255,255,.25)"
                strokeWidth="0.5"
              />
            ))}

            {/* edges (visible + fat invisible hit line) */}
            {model.edges.map((e, i) => {
              const A = model.v[e.a],
                B = model.v[e.b];
              const x1 = proj.px(A[0]),
                y1 = proj.py(A[1]),
                x2 = proj.px(B[0]),
                y2 = proj.py(B[1]);
              const isSel = sel?.kind === "edge" && sel.index === i;
              return (
                <g key={"e" + i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isSel ? "#fff" : showImagery ? brighten(e.type) : pal[e.type]}
                    strokeWidth={LINE_WIDTH[e.type] + (isSel ? 2.4 : 1)}
                    strokeLinecap="round"
                    strokeDasharray={LINE_DASH[e.type]}
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth="16"
                    style={{ cursor: "pointer" }}
                    pointerEvents="stroke"
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      setSel({ kind: "edge", index: i });
                    }}
                  />
                </g>
              );
            })}

            {/* vertices */}
            {Object.entries(model.v).map(([id, p]) => {
              const cx = proj.px(p[0]),
                cy = proj.py(p[1]);
              const isSel = sel?.kind === "vertex" && sel.id === id;
              const raised = p[2] > 0.01;
              return (
                <g key={"v" + id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSel ? 7 : 5}
                    fill={raised ? "var(--tp-accent)" : "#fff"}
                    stroke={isSel ? "#fff" : "var(--tp-accent-600)"}
                    strokeWidth={isSel ? 2.5 : 1.5}
                    style={{ cursor: "grab" }}
                    onPointerDown={onVertexDown(id)}
                  />
                  {isSel && (
                    <text
                      x={cx + 10}
                      y={cy - 9}
                      fontFamily="var(--nj2-font-mono)"
                      fontSize="9.5"
                      fontWeight="600"
                      fill="#fff"
                      style={{ pointerEvents: "none" }}
                    >
                      {id} · z {p[2].toFixed(1)}′
                    </text>
                  )}
                </g>
              );
            })}

            {/* scale bar */}
            <ScaleBar scale={proj.scale} />
          </svg>
        </div>

        {/* ── inspector + measurements ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Inspector
            sel={sel}
            model={model}
            nudgeVertex={nudgeVertex}
            setEdgeType={setEdgeType}
          />
          <Measurements m={m} />
          {orderId && (
            <SaveBar
              saving={saving}
              saveMsg={saveMsg}
              isMock={scene?.isMock ?? true}
              displayId={orderDisplayId}
              onSave={saveModel}
            />
          )}
        </div>
      </div>

      {/* live report preview (rendered FROM the model) */}
      <div style={{ marginTop: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ fontFamily: "var(--nj2-font-body)", fontWeight: 700, fontSize: 15 }}>
            Report preview
            <span
              style={{
                marginLeft: 8,
                fontFamily: "var(--nj2-font-mono)",
                fontSize: 11,
                color: "var(--nj2-fg-3)",
                fontWeight: 500,
              }}
            >
              derived from the same model
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["paper", "blueprint"] as const).map((md) => (
              <button
                key={md}
                onClick={() => setPreviewMode(md)}
                className="tp-pill"
                style={{
                  cursor: "pointer",
                  textTransform: "capitalize",
                  background: previewMode === md ? "var(--tp-accent)" : undefined,
                  color: previewMode === md ? "#fff" : undefined,
                  borderColor: previewMode === md ? "var(--tp-accent)" : undefined,
                }}
              >
                {md}
              </button>
            ))}
          </div>
        </div>
        <div
          className="tp-card"
          style={{
            padding: 24,
            background: previewMode === "blueprint" ? "#0E2A38" : "var(--nj2-bg-card)",
          }}
        >
          <RoofPlanReport model={model} mode={previewMode} showLegend showFacetLabels />
        </div>
      </div>

      <FooterNote />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   sub-components
   ════════════════════════════════════════════════════════════════ */

function brighten(type: LineType): string {
  // lighter line colors so the overlay pops over dark aerial
  return LINE_PALETTE.blueprint[type] as string;
}

function Header({
  reportId,
  address,
  setAddress,
  loading,
  onSearch,
}: {
  reportId: string;
  address: string;
  setAddress: (v: string) => void;
  loading: boolean;
  onSearch: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--nj2-font-mono)",
            fontSize: 10.5,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--nj2-fg-3)",
          }}
        >
          Estimator · Measure tool · {reportId}
        </div>
        <h1
          style={{
            fontFamily: "var(--nj2-font-display)",
            fontSize: 26,
            fontWeight: 700,
            margin: "4px 0 0",
            color: "var(--nj2-fg-1)",
          }}
        >
          Trace the roof
        </h1>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "1 1 360px", maxWidth: 520 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: 11, color: "var(--nj2-fg-4)" }}>
            <Icon name="map-pin" size={16} />
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search an address…"
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: 10,
              border: "1px solid var(--nj2-border)",
              background: "var(--nj2-bg-card)",
              fontFamily: "var(--nj2-font-body)",
              fontSize: 14,
              color: "var(--nj2-fg-1)",
            }}
          />
        </div>
        <button
          onClick={onSearch}
          disabled={loading}
          className="tp-btn"
          style={{
            background: "var(--tp-accent)",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: 10,
            cursor: loading ? "default" : "pointer",
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Loading…" : "Load imagery"}
        </button>
      </div>
    </div>
  );
}

function Toolbar({
  onTemplate,
  onRefit,
  showImagery,
  setShowImagery,
  scene,
}: {
  onTemplate: (k: string) => void;
  onRefit: () => void;
  showImagery: boolean;
  setShowImagery: (v: boolean) => void;
  scene: ImageryScene | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderBottom: "1px solid var(--nj2-border-subtle)",
        background: "var(--nj2-bg-muted)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--nj2-font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: "var(--nj2-fg-3)",
          marginRight: 2,
        }}
      >
        Template
      </span>
      {Object.entries(TEMPLATES).map(([k, t]) => (
        <button key={k} onClick={() => onTemplate(k)} className="tp-pill" style={{ cursor: "pointer" }}>
          {t.label}
        </button>
      ))}
      <span style={{ width: 1, height: 18, background: "var(--nj2-border)", margin: "0 4px" }} />
      <button onClick={onRefit} className="tp-pill" style={{ cursor: "pointer" }}>
        <Icon name="target" size={13} /> Fit
      </button>
      <button
        onClick={() => setShowImagery(!showImagery)}
        className="tp-pill"
        style={{ cursor: "pointer", opacity: showImagery ? 1 : 0.6 }}
      >
        <Icon name="satellite" size={13} /> Imagery
      </button>
      <span style={{ flex: 1 }} />
      {scene && (
        <span
          style={{
            fontFamily: "var(--nj2-font-mono)",
            fontSize: 10.5,
            color: "var(--nj2-fg-3)",
          }}
        >
          {scene.center.lat.toFixed(3)}, {scene.center.lng.toFixed(3)} · {scene.capturedAt} ·{" "}
          {scene.feetPerPixel}ft/px
        </span>
      )}
    </div>
  );
}

function ScaleBar({ scale }: { scale: number }) {
  const ft = 10;
  const len = ft * scale;
  const x = 24,
    y = VBH - 26;
  return (
    <g pointerEvents="none">
      <line x1={x} y1={y} x2={x + len} y2={y} stroke="#fff" strokeWidth="2" />
      <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#fff" strokeWidth="2" />
      <line x1={x + len} y1={y - 4} x2={x + len} y2={y + 4} stroke="#fff" strokeWidth="2" />
      <text
        x={x + len / 2}
        y={y - 7}
        textAnchor="middle"
        fontFamily="var(--nj2-font-mono)"
        fontSize="9.5"
        fill="#fff"
      >
        {ft} ft
      </text>
    </g>
  );
}

function Inspector({
  sel,
  model,
  nudgeVertex,
  setEdgeType,
}: {
  sel: Sel;
  model: RoofModel;
  nudgeVertex: (id: string, axis: 0 | 1 | 2, d: number) => void;
  setEdgeType: (index: number, type: LineType) => void;
}) {
  return (
    <div className="tp-card" style={{ padding: 16 }}>
      <PanelTitle>Inspector</PanelTitle>
      {!sel && (
        <p style={{ fontFamily: "var(--nj2-font-body)", fontSize: 12.5, color: "var(--nj2-fg-3)", margin: 0 }}>
          Drag a vertex to reshape the roof, or click an edge to set its line type. Raise a vertex’s
          height to pitch a facet — the squares, pitch and line lengths recompute live.
        </p>
      )}
      {sel?.kind === "vertex" &&
        (() => {
          const p = model.v[sel.id];
          const axes: [string, 0 | 1 | 2, number][] = [
            ["X (E–W)", 0, 1],
            ["Y (N–S)", 1, 1],
            ["Height z", 2, 0.5],
          ];
          return (
            <div>
              <Tag>Vertex {sel.id}</Tag>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {axes.map(([label, axis, step]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, fontFamily: "var(--nj2-font-body)", fontSize: 12.5 }}>{label}</span>
                    <Stepper onDec={() => nudgeVertex(sel.id, axis, -step)} onInc={() => nudgeVertex(sel.id, axis, step)}>
                      {p[axis].toFixed(axis === 2 ? 1 : 2)}′
                    </Stepper>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      {sel?.kind === "edge" &&
        (() => {
          const e = model.edges[sel.index];
          const len = dist3D(model.v[e.a], model.v[e.b]);
          return (
            <div>
              <Tag>
                Edge {e.a}→{e.b} · {ftIn(len)}
              </Tag>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {LINE_TYPES.map((t) => {
                  const active = e.type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setEdgeType(sel.index, t)}
                      className="tp-pill"
                      style={{
                        cursor: "pointer",
                        background: active ? LINE_PALETTE.paper[t] : undefined,
                        color: active ? "#fff" : undefined,
                        borderColor: active ? LINE_PALETTE.paper[t] : undefined,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 0,
                          borderTop: `2.5px ${t === "valley" ? "dashed" : "solid"} ${active ? "#fff" : LINE_PALETTE.paper[t]}`,
                        }}
                      />
                      {LINE_LABEL[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
    </div>
  );
}

function Measurements({ m }: { m: ReturnType<typeof computeRoof> }) {
  return (
    <div className="tp-card" style={{ padding: 16 }}>
      <PanelTitle>Measurements</PanelTitle>
      <div style={{ fontFamily: "var(--nj2-font-mono)", fontSize: 11.5 }}>
        <Row k="Total area" v={`${commas(Math.round(m.totalArea))} ft²`} strong />
        <Row k="Roof squares" v={`${m.squares.toFixed(1)} SQ`} strong />
        <Row k="Predominant pitch" v={m.predominantPitch} />
        <Row k="Facets" v={String(m.facetCount)} />
        <Row k="Ridges" v={`${Math.round(m.byType.ridge)} ft`} />
        <Row k="Hips" v={`${Math.round(m.byType.hip)} ft`} />
        <Row k="Valleys" v={`${Math.round(m.byType.valley)} ft`} />
        <Row k="Rakes" v={`${Math.round(m.byType.rake)} ft`} />
        <Row k="Eaves" v={`${Math.round(m.byType.eave)} ft`} />
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--nj2-border-subtle)",
          fontFamily: "var(--nj2-font-mono)",
          fontSize: 10.5,
          color: "var(--nj2-fg-3)",
        }}
      >
        {m.facets.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
            <span>facet {f.id}</span>
            <span>
              {Math.round(f.pitch)}/12 · {commas(Math.round(f.area))} ft²
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaveBar({
  saving,
  saveMsg,
  isMock,
  displayId,
  onSave,
}: {
  saving: boolean;
  saveMsg: { ok: boolean; text: string } | null;
  isMock: boolean;
  displayId?: string;
  onSave: () => void;
}) {
  return (
    <div className="tp-card" style={{ padding: 16 }}>
      <PanelTitle>Save to order {displayId ?? ""}</PanelTitle>
      {isMock && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 10,
            padding: "8px 11px",
            borderRadius: 8,
            background: "var(--tp-accent-soft)",
            border: "1px solid var(--tp-accent-ring)",
            color: "var(--tp-accent-600)",
            fontFamily: "var(--nj2-font-body)",
            fontSize: 11.5,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          <Icon name="alert-circle" size={14} />
          Mock imagery — this model saves with isMock=true and is blocked from delivery.
        </div>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="nj2-btn tp-btn-accent"
        style={{ width: "100%", justifyContent: "center", opacity: saving ? 0.7 : 1 }}
      >
        {saving ? "Saving…" : "Save roof model"}
      </button>
      {saveMsg && (
        <div
          style={{
            marginTop: 10,
            fontFamily: "var(--nj2-font-mono)",
            fontSize: 11,
            color: saveMsg.ok ? "var(--nj2-success)" : "var(--nj2-danger)",
          }}
        >
          {saveMsg.text}
        </div>
      )}
    </div>
  );
}

function FooterNote() {
  return (
    <p
      style={{
        marginTop: 26,
        fontFamily: "var(--nj2-font-mono)",
        fontSize: 11,
        color: "var(--nj2-fg-3)",
        lineHeight: 1.7,
      }}
    >
      Phase 2 scope: geometry + trace tool over a mock imagery provider. Saving the model, QA
      sign-off, payments/consent and PDF·ESX·XML export arrive in later phases — the model built
      here is the single source those exporters read from.
    </p>
  );
}

/* ---------- tiny primitives ---------- */
function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--nj2-font-mono)",
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--nj2-fg-3)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "var(--nj2-font-mono)",
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--nj2-fg-1)",
      }}
    >
      {children}
    </span>
  );
}
function Stepper({
  children,
  onDec,
  onInc,
}: {
  children: React.ReactNode;
  onDec: () => void;
  onInc: () => void;
}) {
  const btn: React.CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: 7,
    border: "1px solid var(--nj2-border)",
    background: "var(--nj2-bg-card)",
    cursor: "pointer",
    fontWeight: 700,
    color: "var(--nj2-fg-2)",
    lineHeight: 1,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button style={btn} onClick={onDec} aria-label="decrease">
        −
      </button>
      <span
        style={{
          minWidth: 56,
          textAlign: "center",
          fontFamily: "var(--nj2-font-mono)",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {children}
      </span>
      <button style={btn} onClick={onInc} aria-label="increase">
        +
      </button>
    </span>
  );
}
function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        borderBottom: "1px solid var(--nj2-border-subtle)",
        minHeight: 26,
        lineHeight: 1.4,
      }}
    >
      <span style={{ color: "var(--nj2-fg-3)" }}>{k}</span>
      <span style={{ color: "var(--nj2-fg-1)", fontWeight: strong ? 700 : 600, fontSize: strong ? 13 : 11.5 }}>
        {v}
      </span>
    </div>
  );
}
