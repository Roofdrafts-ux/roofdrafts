import "server-only";
import { MockExtractor } from "./mock";
import { GoogleSolarExtractor } from "./google-solar";
import type { RoofExtractor } from "./types";

/**
 * Select the active roof extractor. Defaults to google-solar when GOOGLE_SOLAR_API_KEY is set,
 * else the deterministic mock. Override with ROOF_EXTRACTOR=mock|google-solar.
 */
export function getRoofExtractor(): RoofExtractor {
  const key = process.env.GOOGLE_SOLAR_API_KEY;
  const choice = process.env.ROOF_EXTRACTOR ?? (key ? "google-solar" : "mock");
  if (choice === "google-solar" && key) return new GoogleSolarExtractor(key);
  return new MockExtractor();
}

export type { ExtractedRoof, RoofExtractor } from "./types";
