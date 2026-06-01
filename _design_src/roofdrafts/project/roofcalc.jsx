// ════════════════════════════════════════════════════════════════
// Roofdrafts — ROOF GEOMETRY ENGINE  (industry-grade logic)
// Models a roof as 3-D vertices (feet) → computes real surface area,
// squares, and edge lengths by true 3-D distance. The diagram is
// RENDERED FROM the model, and the report numbers DERIVE FROM it,
// so drawing and measurements are always self-consistent.
//
//   • Facet surface area via Newell's method on 3-D vertices
//     (the pitch / slope-factor is captured implicitly by the z-rise)
//   • Slope factor = √(1 + (rise/run)²), shown per facet
//   • Squares = total surface area ÷ 100   (1 square = 100 ft²)
//   • Line lengths summed by type: ridge / hip / valley / rake / eave
// ════════════════════════════════════════════════════════════════

/* ---------- vector + geometry helpers ---------- */
const _sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const _len = (v) => Math.hypot(v[0], v[1], v[2]);
const dist3D = (a, b) => _len(_sub(a, b));

// 3-D polygon area via Newell's method (handles non-axis-aligned planes)
function polyArea3D(pts) {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return Math.hypot(nx, ny, nz) / 2;
}
// plan (footprint) area — shoelace on x,y only
function polyAreaPlan(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}
const centroidXY = (pts) => {
  let x = 0, y = 0; pts.forEach(p => { x += p[0]; y += p[1]; });
  return [x / pts.length, y / pts.length];
};
// derive pitch (rise/12) of a facet from its plane normal
function facetPitch(pts) {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const horiz = Math.hypot(nx, ny);
  if (nz === 0) return 12;
  const slope = horiz / Math.abs(nz);        // rise over run
  return Math.round(slope * 12 * 10) / 10;   // in /12
}
const slopeFactor = (pitch12) => Math.sqrt(1 + Math.pow(pitch12 / 12, 2));

// feet (decimal) → 12' 6" string
function ftIn(ft) {
  const whole = Math.floor(ft);
  let inch = Math.round((ft - whole) * 12);
  let w = whole;
  if (inch === 12) { w += 1; inch = 0; }
  return `${w}′ ${inch}″`;
}
const commas = (n) => n.toLocaleString('en-US');

/* ---------- the compute step ---------- */
function computeRoof(model) {
  const V = model.v;
  const facets = model.facets.map((f) => {
    const pts = f.verts.map((id) => V[id]);
    const area = polyArea3D(pts);
    const planArea = polyAreaPlan(pts);
    const pitch = facetPitch(pts);
    return { ...f, pts, area, planArea, pitch, c: centroidXY(pts) };
  });
  const byType = { ridge: 0, hip: 0, valley: 0, rake: 0, eave: 0 };
  model.edges.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + dist3D(V[e.a], V[e.b]);
  });
  const totalArea = facets.reduce((s, f) => s + f.area, 0);
  const planTotal = facets.reduce((s, f) => s + f.planArea, 0);
  // predominant pitch = pitch covering the most area
  const byPitch = {};
  facets.forEach(f => { byPitch[f.pitch] = (byPitch[f.pitch] || 0) + f.area; });
  const predominant = Object.keys(byPitch).sort((a, b) => byPitch[b] - byPitch[a])[0];
  return {
    facets, byType, totalArea, planTotal,
    squares: totalArea / 100,
    predominantPitch: `${Math.round(predominant)}/12`,
    facetCount: facets.length,
    perimeter: byType.eave + byType.rake,
  };
}

/* ════════════════════════════════════════════════════════════════
   ROOF MODELS  (each is a geometrically valid 3-D roof)
   Coordinates in feet. z = height above eave line.
   ════════════════════════════════════════════════════════════════ */

// CROSS-GABLE — main gable + perpendicular gable wing, equal 6/12 pitch.
// Produces ridge + eave + rake + valley line types. Hand-verified:
// plan area 1,824 ft² → surface 2,039 ft² (20.4 SQ).
const MODEL_CROSS_GABLE = {
  name: 'Cross-gable hip',
  v: {
    a: [0, 0, 0], b: [52, 0, 0], c: [52, 24, 0], d: [0, 24, 0],
    rw: [0, 12, 6], re: [52, 12, 6],
    ww1: [14, 24, 0], we1: [38, 24, 0], ww2: [14, 48, 0], we2: [38, 48, 0],
    wr1: [26, 12, 6], wr2: [26, 48, 6],
  },
  facets: [
    { id: 'S', verts: ['a', 'b', 're', 'rw'] },
    { id: 'N', verts: ['rw', 're', 'c', 'we1', 'wr1', 'ww1', 'd'] },
    { id: 'WW', verts: ['wr1', 'wr2', 'ww2', 'ww1'] },
    { id: 'WE', verts: ['wr1', 'we1', 'we2', 'wr2'] },
  ],
  edges: [
    { type: 'eave', a: 'a', b: 'b' }, { type: 'eave', a: 'c', b: 'we1' },
    { type: 'eave', a: 'ww1', b: 'd' }, { type: 'eave', a: 'ww1', b: 'ww2' },
    { type: 'eave', a: 'we1', b: 'we2' },
    { type: 'ridge', a: 'rw', b: 're' }, { type: 'ridge', a: 'wr1', b: 'wr2' },
    { type: 'rake', a: 'a', b: 'rw' }, { type: 'rake', a: 'rw', b: 'd' },
    { type: 'rake', a: 'b', b: 're' }, { type: 'rake', a: 're', b: 'c' },
    { type: 'rake', a: 'ww2', b: 'wr2' }, { type: 'rake', a: 'wr2', b: 'we2' },
    { type: 'valley', a: 'ww1', b: 'wr1' }, { type: 'valley', a: 'we1', b: 'wr1' },
  ],
};

// SIMPLE GABLE — rectangle 32×24, 5/12. ridge + eave + rake.
// plan 768 ft² → surface 832 ft² (8.3 SQ).
const MODEL_GABLE = {
  name: 'Gable',
  v: {
    a: [0, 0, 0], b: [32, 0, 0], c: [32, 24, 0], d: [0, 24, 0],
    r1: [0, 12, 5], r2: [32, 12, 5],
  },
  facets: [
    { id: 'S', verts: ['a', 'b', 'r2', 'r1'] },
    { id: 'N', verts: ['r1', 'r2', 'c', 'd'] },
  ],
  edges: [
    { type: 'eave', a: 'a', b: 'b' }, { type: 'eave', a: 'c', b: 'd' },
    { type: 'ridge', a: 'r1', b: 'r2' },
    { type: 'rake', a: 'a', b: 'r1' }, { type: 'rake', a: 'r1', b: 'd' },
    { type: 'rake', a: 'b', b: 'r2' }, { type: 'rake', a: 'r2', b: 'c' },
  ],
};

/* ---------- line-type styling (EagleView-style legend) ---------- */
const LINE_TYPES = ['ridge', 'hip', 'valley', 'rake', 'eave'];
const LINE_LABEL = { ridge: 'Ridge', hip: 'Hip', valley: 'Valley', rake: 'Rake', eave: 'Eave' };
const LINE_PALETTE = {
  paper:     { ridge: '#C2603A', hip: '#B7791F', valley: '#B23A2E', rake: '#3C7A52', eave: '#2A6076', facet: 'rgba(42,96,118,.05)', label: '#1C4A5C', dim: '#7C7159', key: '#BE5630' },
  blueprint: { ridge: '#FFB27D', hip: '#F2C94C', valley: '#FF8A6B', rake: '#9BE6B0', eave: '#7FD4E8', facet: 'rgba(191,228,239,.05)', label: '#DCEEF2', dim: 'rgba(191,228,239,.6)', key: '#FFB27D' },
};
const LINE_WIDTH = { ridge: 2.4, hip: 2.2, valley: 1.9, rake: 1.7, eave: 2.2 };
const LINE_DASH = { valley: '5 3' };

/* ════════════════════════════════════════════════════════════════
   RENDERER — draws the plan FROM a computed model
   ════════════════════════════════════════════════════════════════ */
function RoofPlanReport({ model, mode = 'paper', animate = false, showFacetLabels = true, showLegend = true, padding = 46 }) {
  const m = useMemo(() => computeRoof(model), [model]);
  const pal = LINE_PALETTE[mode];

  // bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.values(model.v).forEach(([x, y]) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  });
  const wFt = maxX - minX, hFt = maxY - minY;
  const VBW = 520, drawW = VBW - padding * 2;
  const scale = drawW / wFt;
  const VBH = hFt * scale + padding * 2;
  // project plan (x,y ft) → svg px ; north = up (invert y)
  const px = (x) => padding + (x - minX) * scale;
  const py = (y) => padding + (maxY - y) * scale;

  const dash = animate ? { strokeDasharray: 1400, strokeDashoffset: 1400, animation: 'tpDraw 1.7s var(--nj2-ease) .15s forwards' } : {};
  const present = LINE_TYPES.filter(t => m.byType[t] > 0.5);

  return (
    <div>
      <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}
        role="img" aria-label={`Measured roof plan — ${Math.round(m.totalArea)} square feet`}>
        {/* facet fills */}
        {m.facets.map((f) => (
          <polygon key={'f' + f.id} points={f.pts.map(p => `${px(p[0])},${py(p[1])}`).join(' ')}
            fill={pal.facet} stroke={pal.eave} strokeOpacity="0.18" strokeWidth="0.5" />
        ))}
        {/* edges, color-coded by type */}
        {model.edges.map((e, i) => {
          const A = model.v[e.a], B = model.v[e.b];
          return (
            <line key={'e' + i} x1={px(A[0])} y1={py(A[1])} x2={px(B[0])} y2={py(B[1])}
              stroke={pal[e.type]} strokeWidth={LINE_WIDTH[e.type]} strokeLinecap="round"
              strokeDasharray={LINE_DASH[e.type]} style={LINE_DASH[e.type] ? {} : dash} />
          );
        })}
        {/* per-facet pitch + area labels */}
        {showFacetLabels && m.facets.map((f) => {
          const cx = px(f.c[0]), cy = py(f.c[1]);
          return (
            <g key={'l' + f.id} transform={`translate(${cx},${cy})`} style={{ pointerEvents: 'none' }}>
              <path d="M-9,4 L6,4 L6,-4 Z" fill="none" stroke={pal.key} strokeWidth="1.1" />
              <text x="10" y="3.5" fontFamily="var(--nj2-font-mono)" fontWeight="600" fontSize="9.5" fill={pal.key}>{Math.round(f.pitch)}/12</text>
              <text x="-9" y="17" fontFamily="var(--nj2-font-mono)" fontSize="8.5" fill={pal.dim}>{commas(Math.round(f.area))} ft²</text>
            </g>
          );
        })}
        {/* overall dimensions */}
        <DimAxis x1={px(minX)} y1={py(minY) + 22} x2={px(maxX)} y2={py(minY) + 22} label={ftIn(wFt)} color={pal.dim} horizontal />
        <DimAxis x1={px(maxX) + 22} y1={py(maxY)} x2={px(maxX) + 22} y2={py(minY)} label={ftIn(hFt)} color={pal.dim} />
        {/* north arrow */}
        <g transform={`translate(${VBW - 24},${28})`}>
          <circle r="12" fill="none" stroke={pal.dim} strokeOpacity="0.5" strokeWidth="0.8" />
          <path d="M0,-7 L2.8,3.5 L0,1.2 L-2.8,3.5 Z" fill={pal.label} />
          <text y="-14" textAnchor="middle" fontFamily="var(--nj2-font-mono)" fontSize="8" fill={pal.dim}>N</text>
        </g>
      </svg>

      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 10, justifyContent: 'center' }}>
          {present.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--nj2-font-mono)', fontSize: 10, color: pal.dim }}>
              <span style={{ width: 14, height: 0, borderTop: `2.5px ${t === 'valley' ? 'dashed' : 'solid'} ${pal[t]}` }} />
              {LINE_LABEL[t]} <span style={{ color: pal.label, fontWeight: 600 }}>{Math.round(m.byType[t])}′</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DimAxis({ x1, y1, x2, y2, label, color, horizontal }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const t = 4;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.7" />
      {horizontal ? (<>
        <line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} stroke={color} strokeWidth="0.7" />
        <line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} stroke={color} strokeWidth="0.7" />
        <g transform={`translate(${mx},${my + 12})`}><rect x="-20" y="-9" width="40" height="13" rx="2" fill="var(--nj2-bg-card)" opacity="0.0" /><text textAnchor="middle" fontFamily="var(--nj2-font-mono)" fontSize="9.5" fontWeight="500" fill={color}>{label}</text></g>
      </>) : (<>
        <line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} stroke={color} strokeWidth="0.7" />
        <line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} stroke={color} strokeWidth="0.7" />
        <g transform={`translate(${mx + 9},${my}) rotate(-90)`}><text textAnchor="middle" fontFamily="var(--nj2-font-mono)" fontSize="9.5" fontWeight="500" fill={color}>{label}</text></g>
      </>)}
    </g>
  );
}

/* ---------- backwards-compatible wrappers used across the site ---------- */
function RoofPlanHero({ animate = true }) {
  return <RoofPlanReport model={MODEL_CROSS_GABLE} mode="blueprint" animate={animate} showLegend={true} showFacetLabels={true} />;
}
function RoofPlanCompact({ pitch, animate = false, mode = 'paper', showLegend = false }) {
  return <RoofPlanReport model={MODEL_GABLE} mode={mode} animate={animate} showLegend={showLegend} showFacetLabels={false} padding={34} />;
}

Object.assign(window, {
  computeRoof, slopeFactor, ftIn, commas,
  MODEL_CROSS_GABLE, MODEL_GABLE, LINE_TYPES, LINE_LABEL,
  RoofPlanReport, RoofPlanHero, RoofPlanCompact,
});
