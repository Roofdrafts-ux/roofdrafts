// AppliCad roof-export (XML) parser + report summarizer.
// Pure string parsing — the export format is rigid machine output, so targeted
// regexes are safer than a DOM parser here (no entities, no namespaces in the
// payload we read). Everything is unit-tested against a real export whose
// numbers we verified against the vendor's own PDF report.

export interface AppliPoint {
  x: number;
  y: number;
  z: number;
}

export interface AppliLine {
  id: string;
  a: string; // point id
  b: string; // point id
  type: string; // EAVE | RAKE | RIDGE | HIP | VALLEY | STEP | APRON | BOX-GUTTER | NONE
  length: number; // lf
}

export interface AppliFace {
  id: string;
  /** Line-id loops; the export separates multiple loops (holes) with "L0". */
  loops: string[][];
  size: number; // sf (sloped surface area, from the export)
  pitch: number; // rise per 12 (decimal)
  material: string;
}

export interface AppliRoof {
  points: Record<string, AppliPoint>;
  lines: Record<string, AppliLine>;
  faces: AppliFace[];
}

export function parseAppliCad(xml: string): AppliRoof {
  const points: Record<string, AppliPoint> = {};
  for (const m of xml.matchAll(/<POINT id="(C\d+)" data="([^"]+)"\s*\/>/g)) {
    const [x, y, z] = m[2].split(",").map(Number);
    points[m[1]] = { x, y, z };
  }

  const lines: Record<string, AppliLine> = {};
  for (const m of xml.matchAll(
    /<LINE id="(L\d+)" path="(C\d+),(C\d+)" type="([A-Z-]+)" length="([\d.]+)"/g
  )) {
    lines[m[1]] = { id: m[1], a: m[2], b: m[3], type: m[4], length: Number(m[5]) };
  }

  const faces: AppliFace[] = [];
  for (const m of xml.matchAll(
    /<POLYGON id="(P\d+)" path="([^"]+)"\s+size\s*=\s*"([\d.]+)"[^>]*?pitch="([\d.]+)"[^>]*?mat="([^"]*)"/g
  )) {
    const ids = m[2].split(",").map((s) => s.trim());
    const loops: string[][] = [];
    let cur: string[] = [];
    for (const id of ids) {
      if (id === "L0") {
        if (cur.length) loops.push(cur);
        cur = [];
      } else {
        cur.push(id);
      }
    }
    if (cur.length) loops.push(cur);
    faces.push({ id: m[1], loops, size: Number(m[3]), pitch: Number(m[4]), material: m[5] });
  }

  return { points, lines, faces };
}

/* ───────────────────────── geometry (plan view) ───────────────────────── */

const ptKey = (p: AppliPoint) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;

/**
 * Order a loop of line ids into a 2D polyline (plan x/y). Endpoints are
 * matched by coordinate (the export reuses coordinates under different point
 * ids). Best-effort: if the chain breaks, returns what was assembled.
 */
export function loopToPolygon(
  loop: string[],
  roof: AppliRoof
): [number, number][] {
  type Seg = { ak: string; bk: string; a: AppliPoint; b: AppliPoint; used: boolean };
  const segs: Seg[] = [];
  for (const id of loop) {
    const ln = roof.lines[id];
    if (!ln) continue;
    const a = roof.points[ln.a];
    const b = roof.points[ln.b];
    if (!a || !b) continue;
    segs.push({ ak: ptKey(a), bk: ptKey(b), a, b, used: false });
  }
  if (segs.length === 0) return [];

  const out: AppliPoint[] = [segs[0].a, segs[0].b];
  segs[0].used = true;
  let endKey = segs[0].bk;

  for (let step = 1; step < segs.length; step++) {
    const next = segs.find((s) => !s.used && (s.ak === endKey || s.bk === endKey));
    if (!next) break;
    next.used = true;
    if (next.ak === endKey) {
      out.push(next.b);
      endKey = next.bk;
    } else {
      out.push(next.a);
      endKey = next.ak;
    }
  }

  // Drop the closing point if the loop returned to its start.
  if (out.length > 1 && ptKey(out[0]) === ptKey(out[out.length - 1])) out.pop();
  return out.map((p) => [p.x, p.y]);
}

export interface PlanBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function planBounds(roof: AppliRoof): PlanBounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of Object.values(roof.points)) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/* ───────────────────────── report summary ───────────────────────── */

/** Edge categories shown on the report, in display order. */
export const EDGE_ROWS = [
  ["EAVE", "Eave"],
  ["RAKE", "Rake"],
  ["RIDGE", "Ridge"],
  ["HIP", "Hip"],
  ["VALLEY", "Valley"],
  ["STEP", "Step flashing"],
  ["APRON", "Wall flashing"],
  ["BOX-GUTTER", "Box gutter"],
] as const;

export interface PitchRow {
  label: string; // e.g. "12/12"
  pitch: number;
  areaSf: number;
  squares: number;
  pct: number; // 0..100
}

export interface WasteRow {
  pct: number;
  areaSf: number;
  squares: number;
}

export interface RoofSummary {
  totalAreaSf: number;
  squares: number;
  /** lf by AppliCad edge type (only types present). */
  edgeLf: Record<string, number>;
  /** Eave + rake. */
  perimeterLf: number;
  pitchRows: PitchRow[];
  wasteRows: WasteRow[];
  facetCount: number;
  predominantPitch: string;
}

/** "11.03" → "11/12", "13.50" → "13.5/12", "0.05" → "flat". */
export function pitchLabel(pitch: number): string {
  const snapped = Math.round(pitch * 2) / 2;
  if (snapped === 0) return "flat";
  return `${snapped % 1 === 0 ? snapped : snapped.toFixed(1)}/12`;
}

export const WASTE_FACTORS = [0, 5, 10, 15, 20];

export function summarizeRoof(roof: AppliRoof): RoofSummary {
  const totalAreaSf = roof.faces.reduce((s, f) => s + f.size, 0);
  const squares = totalAreaSf / 100;

  const edgeLf: Record<string, number> = {};
  for (const ln of Object.values(roof.lines)) {
    if (ln.type === "NONE") continue;
    edgeLf[ln.type] = (edgeLf[ln.type] ?? 0) + ln.length;
  }

  const byLabel = new Map<string, PitchRow>();
  for (const f of roof.faces) {
    const label = pitchLabel(f.pitch);
    const row = byLabel.get(label) ?? {
      label,
      pitch: Math.round(f.pitch * 2) / 2,
      areaSf: 0,
      squares: 0,
      pct: 0,
    };
    row.areaSf += f.size;
    byLabel.set(label, row);
  }
  const pitchRows = [...byLabel.values()]
    .sort((a, b) => b.areaSf - a.areaSf)
    .map((r) => ({
      ...r,
      squares: r.areaSf / 100,
      pct: totalAreaSf > 0 ? (r.areaSf / totalAreaSf) * 100 : 0,
    }));

  const wasteRows = WASTE_FACTORS.map((pct) => ({
    pct,
    areaSf: totalAreaSf * (1 + pct / 100),
    squares: (totalAreaSf * (1 + pct / 100)) / 100,
  }));

  return {
    totalAreaSf,
    squares,
    edgeLf,
    perimeterLf: (edgeLf["EAVE"] ?? 0) + (edgeLf["RAKE"] ?? 0),
    pitchRows,
    wasteRows,
    facetCount: roof.faces.length,
    predominantPitch: pitchRows[0]?.label ?? "—",
  };
}
