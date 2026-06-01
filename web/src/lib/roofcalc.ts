// ════════════════════════════════════════════════════════════════
// Roofdrafts — ROOF GEOMETRY ENGINE  (industry-grade logic)
// Models a roof as 3-D vertices (feet) → computes real surface area,
// squares, and edge lengths by true 3-D distance. The diagram is
// RENDERED FROM the model, and the report numbers DERIVE FROM it,
// so drawing and measurements are always self-consistent.
// ════════════════════════════════════════════════════════════════

export type Vec3 = [number, number, number];
export type LineType = "ridge" | "hip" | "valley" | "rake" | "eave";

export interface Facet {
  id: string;
  verts: string[];
}
export interface Edge {
  type: LineType;
  a: string;
  b: string;
}
export interface RoofModel {
  name: string;
  v: Record<string, Vec3>;
  facets: Facet[];
  edges: Edge[];
}
export interface ComputedFacet extends Facet {
  pts: Vec3[];
  area: number;
  planArea: number;
  pitch: number;
  c: [number, number];
}
export interface ComputedRoof {
  facets: ComputedFacet[];
  byType: Record<LineType, number>;
  totalArea: number;
  planTotal: number;
  squares: number;
  predominantPitch: string;
  facetCount: number;
  perimeter: number;
}

/* ---------- vector + geometry helpers ---------- */
const _sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const _len = (v: Vec3): number => Math.hypot(v[0], v[1], v[2]);
export const dist3D = (a: Vec3, b: Vec3): number => _len(_sub(a, b));

// 3-D polygon area via Newell's method (handles non-axis-aligned planes)
export function polyArea3D(pts: Vec3[]): number {
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return Math.hypot(nx, ny, nz) / 2;
}
// plan (footprint) area — shoelace on x,y only
export function polyAreaPlan(pts: Vec3[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}
const centroidXY = (pts: Vec3[]): [number, number] => {
  let x = 0,
    y = 0;
  pts.forEach((p) => {
    x += p[0];
    y += p[1];
  });
  return [x / pts.length, y / pts.length];
};
// derive pitch (rise/12) of a facet from its plane normal
function facetPitch(pts: Vec3[]): number {
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const horiz = Math.hypot(nx, ny);
  if (nz === 0) return 12;
  const slope = horiz / Math.abs(nz); // rise over run
  return Math.round(slope * 12 * 10) / 10; // in /12
}
export const slopeFactor = (pitch12: number): number =>
  Math.sqrt(1 + Math.pow(pitch12 / 12, 2));

// feet (decimal) → 12' 6" string
export function ftIn(ft: number): string {
  const whole = Math.floor(ft);
  let inch = Math.round((ft - whole) * 12);
  let w = whole;
  if (inch === 12) {
    w += 1;
    inch = 0;
  }
  return `${w}′ ${inch}″`;
}
export const commas = (n: number): string => n.toLocaleString("en-US");

/* ---------- the compute step ---------- */
export function computeRoof(model: RoofModel): ComputedRoof {
  const V = model.v;
  const facets: ComputedFacet[] = model.facets.map((f) => {
    const pts = f.verts.map((id) => V[id]);
    const area = polyArea3D(pts);
    const planArea = polyAreaPlan(pts);
    const pitch = facetPitch(pts);
    return { ...f, pts, area, planArea, pitch, c: centroidXY(pts) };
  });
  const byType: Record<LineType, number> = {
    ridge: 0,
    hip: 0,
    valley: 0,
    rake: 0,
    eave: 0,
  };
  model.edges.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + dist3D(V[e.a], V[e.b]);
  });
  const totalArea = facets.reduce((s, f) => s + f.area, 0);
  const planTotal = facets.reduce((s, f) => s + f.planArea, 0);
  // predominant pitch = pitch covering the most area
  const byPitch: Record<string, number> = {};
  facets.forEach((f) => {
    byPitch[f.pitch] = (byPitch[f.pitch] || 0) + f.area;
  });
  const predominant = Object.keys(byPitch).sort(
    (a, b) => byPitch[b] - byPitch[a],
  )[0];
  return {
    facets,
    byType,
    totalArea,
    planTotal,
    squares: totalArea / 100,
    predominantPitch: `${Math.round(Number(predominant))}/12`,
    facetCount: facets.length,
    perimeter: byType.eave + byType.rake,
  };
}

/* ════════════════════════════════════════════════════════════════
   ROOF MODELS  (each is a geometrically valid 3-D roof)
   Coordinates in feet. z = height above eave line.
   ════════════════════════════════════════════════════════════════ */

// CROSS-GABLE — main gable + perpendicular gable wing, equal 6/12 pitch.
export const MODEL_CROSS_GABLE: RoofModel = {
  name: "Cross-gable hip",
  v: {
    a: [0, 0, 0],
    b: [52, 0, 0],
    c: [52, 24, 0],
    d: [0, 24, 0],
    rw: [0, 12, 6],
    re: [52, 12, 6],
    ww1: [14, 24, 0],
    we1: [38, 24, 0],
    ww2: [14, 48, 0],
    we2: [38, 48, 0],
    wr1: [26, 12, 6],
    wr2: [26, 48, 6],
  },
  facets: [
    { id: "S", verts: ["a", "b", "re", "rw"] },
    { id: "N", verts: ["rw", "re", "c", "we1", "wr1", "ww1", "d"] },
    { id: "WW", verts: ["wr1", "wr2", "ww2", "ww1"] },
    { id: "WE", verts: ["wr1", "we1", "we2", "wr2"] },
  ],
  edges: [
    { type: "eave", a: "a", b: "b" },
    { type: "eave", a: "c", b: "we1" },
    { type: "eave", a: "ww1", b: "d" },
    { type: "eave", a: "ww1", b: "ww2" },
    { type: "eave", a: "we1", b: "we2" },
    { type: "ridge", a: "rw", b: "re" },
    { type: "ridge", a: "wr1", b: "wr2" },
    { type: "rake", a: "a", b: "rw" },
    { type: "rake", a: "rw", b: "d" },
    { type: "rake", a: "b", b: "re" },
    { type: "rake", a: "re", b: "c" },
    { type: "rake", a: "ww2", b: "wr2" },
    { type: "rake", a: "wr2", b: "we2" },
    { type: "valley", a: "ww1", b: "wr1" },
    { type: "valley", a: "we1", b: "wr1" },
  ],
};

// SIMPLE GABLE — rectangle 32×24, 5/12. ridge + eave + rake.
export const MODEL_GABLE: RoofModel = {
  name: "Gable",
  v: {
    a: [0, 0, 0],
    b: [32, 0, 0],
    c: [32, 24, 0],
    d: [0, 24, 0],
    r1: [0, 12, 5],
    r2: [32, 12, 5],
  },
  facets: [
    { id: "S", verts: ["a", "b", "r2", "r1"] },
    { id: "N", verts: ["r1", "r2", "c", "d"] },
  ],
  edges: [
    { type: "eave", a: "a", b: "b" },
    { type: "eave", a: "c", b: "d" },
    { type: "ridge", a: "r1", b: "r2" },
    { type: "rake", a: "a", b: "r1" },
    { type: "rake", a: "r1", b: "d" },
    { type: "rake", a: "b", b: "r2" },
    { type: "rake", a: "r2", b: "c" },
  ],
};

/* ---------- line-type styling (EagleView-style legend) ---------- */
export const LINE_TYPES: LineType[] = ["ridge", "hip", "valley", "rake", "eave"];
export const LINE_LABEL: Record<LineType, string> = {
  ridge: "Ridge",
  hip: "Hip",
  valley: "Valley",
  rake: "Rake",
  eave: "Eave",
};
export const LINE_PALETTE: Record<"paper" | "blueprint", Record<string, string>> = {
  paper: {
    ridge: "#C2603A",
    hip: "#B7791F",
    valley: "#B23A2E",
    rake: "#3C7A52",
    eave: "#2A6076",
    facet: "rgba(42,96,118,.05)",
    label: "#1C4A5C",
    dim: "#7C7159",
    key: "#BE5630",
  },
  blueprint: {
    ridge: "#FFB27D",
    hip: "#F2C94C",
    valley: "#FF8A6B",
    rake: "#9BE6B0",
    eave: "#7FD4E8",
    facet: "rgba(191,228,239,.05)",
    label: "#DCEEF2",
    dim: "rgba(191,228,239,.6)",
    key: "#FFB27D",
  },
};
export const LINE_WIDTH: Record<LineType, number> = {
  ridge: 2.4,
  hip: 2.2,
  valley: 1.9,
  rake: 1.7,
  eave: 2.2,
};
export const LINE_DASH: Partial<Record<LineType, string>> = { valley: "5 3" };
