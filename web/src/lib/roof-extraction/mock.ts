// Deterministic MOCK extractor — produces a valid, address-seeded draft RoofModel with
// no external API. Lets the full AI-draft → human-verify loop run in dev/demo. Pure + testable.
import { MODEL_GABLE, MODEL_CROSS_GABLE, type RoofModel, type Vec3 } from "@/lib/roofcalc";
import type { ExtractedRoof, RoofExtractor } from "./types";

/** Stable 32-bit FNV-1a hash so the same address always yields the same draft. */
function seedOf(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function cloneScaled(m: RoofModel, factor: number): RoofModel {
  return {
    name: m.name,
    // Scale every coordinate (x, y, z) uniformly — preserves pitch and geometric validity.
    v: Object.fromEntries(
      Object.entries(m.v).map(([k, p]) => [k, [p[0] * factor, p[1] * factor, p[2] * factor] as Vec3])
    ),
    facets: m.facets.map((f) => ({ id: f.id, verts: [...f.verts] })),
    edges: m.edges.map((e) => ({ ...e })),
  };
}

export class MockExtractor implements RoofExtractor {
  readonly source = "mock";

  async extract(address: string): Promise<ExtractedRoof> {
    const seed = seedOf(address.trim().toLowerCase());
    // Pick a template and a size factor (0.85–1.30) deterministically from the address.
    const template = seed % 2 === 0 ? MODEL_CROSS_GABLE : MODEL_GABLE;
    const factor = 0.85 + ((seed >>> 8) % 46) / 100; // 0.85 .. 1.30
    // Confidence 0.62–0.92 — mock imagery is never high-confidence.
    const confidence = 0.62 + ((seed >>> 16) % 31) / 100;

    return {
      model: cloneScaled(template, factor),
      confidence: Math.round(confidence * 100) / 100,
      source: this.source,
      isMock: true,
    };
  }
}
