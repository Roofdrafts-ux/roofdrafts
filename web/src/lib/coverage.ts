// Service-coverage config — pure, testable. States we currently produce reports for.

export interface CoverageRegion {
  code: string;
  name: string;
  /** Imagery freshness tier we can source for this region. */
  imageryTier: "premium" | "standard";
}

export const COVERAGE: CoverageRegion[] = [
  { code: "TX", name: "Texas", imageryTier: "premium" },
  { code: "NC", name: "North Carolina", imageryTier: "premium" },
  { code: "OR", name: "Oregon", imageryTier: "standard" },
  { code: "FL", name: "Florida", imageryTier: "premium" },
  { code: "CO", name: "Colorado", imageryTier: "standard" },
  { code: "GA", name: "Georgia", imageryTier: "standard" },
];

const COVERED = new Set(COVERAGE.map((r) => r.code));

/** Whether a 2-letter state code is currently serviced. */
export function isCovered(stateCode: string): boolean {
  return COVERED.has(stateCode.trim().toUpperCase());
}
