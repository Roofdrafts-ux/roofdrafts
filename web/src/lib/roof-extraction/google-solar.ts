// Google Solar API extractor (Phase 2 path). Geocodes the address, calls Solar
// buildingInsights, and maps roof segments → a draft RoofModel. Needs GOOGLE_SOLAR_API_KEY.
// `solarToRoofModel` is a pure function (exported for tests).
import type { RoofModel, Vec3, Edge } from "@/lib/roofcalc";
import type { ExtractedRoof, RoofExtractor } from "./types";

const M_TO_FT = 3.280839895;
const M2_TO_FT2 = 10.7639104;

export interface SolarRoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  /** Sloped surface area of the segment, m². */
  areaMeters2: number;
}

/**
 * Best-effort mapping of Solar roof segments into a valid RoofModel: each segment becomes a
 * pitched rectangular facet (eave→ridge), laid out in a row. Approximate topology (no shared
 * ridges/valleys) — a draft for the estimator to correct — but totals/pitch are faithful and
 * the geometry is valid for the engine. Pure.
 */
export function solarToRoofModel(segments: SolarRoofSegment[], name = "Google Solar draft"): RoofModel {
  const v: Record<string, Vec3> = {};
  const facets: RoofModel["facets"] = [];
  const edges: Edge[] = [];
  let cursorX = 0;
  const GAP = 2;

  segments.forEach((seg, i) => {
    const pitch12 = Math.max(0, 12 * Math.tan((seg.pitchDegrees * Math.PI) / 180));
    const slope = Math.sqrt(1 + (pitch12 / 12) ** 2) || 1;
    // surface area → plan (footprint) area, then a square footprint of side s.
    const planFt2 = (seg.areaMeters2 * M2_TO_FT2) / slope;
    const s = Math.max(6, Math.sqrt(planFt2)); // floor to keep tiny segments valid
    const rise = (pitch12 / 12) * s; // ridge height over the run `s`
    const x0 = cursorX;
    const ids = [`s${i}a`, `s${i}b`, `s${i}c`, `s${i}d`];
    v[ids[0]] = [x0, 0, 0]; // eave-left
    v[ids[1]] = [x0 + s, 0, 0]; // eave-right
    v[ids[2]] = [x0 + s, s, rise]; // ridge-right
    v[ids[3]] = [x0, s, rise]; // ridge-left
    facets.push({ id: `S${i}`, verts: ids });
    edges.push(
      { type: "eave", a: ids[0], b: ids[1] },
      { type: "ridge", a: ids[3], b: ids[2] },
      { type: "rake", a: ids[0], b: ids[3] },
      { type: "rake", a: ids[1], b: ids[2] }
    );
    cursorX += s + GAP;
  });

  return { name, v, facets, edges };
}

function confidenceFromQuality(q?: string): number {
  switch ((q ?? "").toUpperCase()) {
    case "HIGH": return 0.9;
    case "MEDIUM": return 0.78;
    case "LOW": return 0.62;
    default: return 0.7;
  }
}

export class GoogleSolarExtractor implements RoofExtractor {
  readonly source = "google-solar";
  constructor(private apiKey: string) {}

  async extract(address: string): Promise<ExtractedRoof> {
    // 1. Geocode address → lat/lng.
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
    );
    const geo = await geoRes.json();
    const loc = geo?.results?.[0]?.geometry?.location;
    if (!loc) throw new Error("Solar extractor: address could not be geocoded.");

    // 2. Solar buildingInsights findClosest.
    const solarRes = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${loc.lat}&location.longitude=${loc.lng}&key=${this.apiKey}`
    );
    if (!solarRes.ok) throw new Error(`Solar API ${solarRes.status}`);
    const insights = await solarRes.json();
    const solar = insights?.solarPotential;
    const segs: SolarRoofSegment[] = (solar?.roofSegmentStats ?? []).map(
      (r: { pitchDegrees?: number; azimuthDegrees?: number; stats?: { areaMeters2?: number } }) => ({
        pitchDegrees: r.pitchDegrees ?? 20,
        azimuthDegrees: r.azimuthDegrees ?? 180,
        areaMeters2: r.stats?.areaMeters2 ?? 0,
      })
    ).filter((s: SolarRoofSegment) => s.areaMeters2 > 0);

    if (segs.length === 0) throw new Error("Solar extractor: no roof segments returned.");

    return {
      model: solarToRoofModel(segs),
      confidence: confidenceFromQuality(insights?.imageryQuality),
      source: this.source,
      isMock: false,
    };
  }
}
