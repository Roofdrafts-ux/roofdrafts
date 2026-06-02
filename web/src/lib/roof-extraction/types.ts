// Roof-extraction layer — turns an address into a draft RoofModel for human verification.
// Pure types (no server-only) so mappers/extractors stay unit-testable.
import type { RoofModel } from "@/lib/roofcalc";

export interface ExtractedRoof {
  /** The drafted geometry — same shape the engine + measure tool consume. */
  model: RoofModel;
  /** 0..1 confidence in the auto-draft (drives QA routing). */
  confidence: number;
  /** Extractor identity, e.g. "mock" | "google-solar". */
  source: string;
  /** True when derived from mock/dev imagery — must never ship as a real report. */
  isMock: boolean;
}

export interface RoofExtractor {
  readonly source: string;
  /** Produce a draft roof model for an address. Never throws for "no roof found" —
   *  return a low-confidence best guess so a human can correct it. */
  extract(address: string): Promise<ExtractedRoof>;
}
