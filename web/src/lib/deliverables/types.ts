import "server-only";

/**
 * Normalized roof-report data that every exporter reads from.
 * Built from a persisted RoofModel row (the single source of truth).
 */
export interface RoofReportData {
  displayId: string;
  address: string;
  reportType: string;
  generatedAt: string; // ISO
  totalSqFt: number;
  squares: number;
  predominantPitch: string;
  lengths: {
    ridge: number;
    hip: number;
    valley: number;
    rake: number;
    eave: number;
  };
  facets: Array<{ id: string; pitch: number; planArea: number; area: number }>;
  /** True when traced over mock imagery — artifacts MUST be watermarked + never delivered as real. */
  isMock: boolean;
}

export type DeliverableKind = "PDF" | "XACTIMATE_ESX" | "XML";

export interface DeliverableArtifact {
  kind: DeliverableKind;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  /** Carried through so download handlers can refuse to serve a real (non-watermarked) file. */
  isMock: boolean;
}

/** Every exporter implements this. */
export interface Exporter {
  readonly kind: DeliverableKind;
  generate(data: RoofReportData): Promise<DeliverableArtifact> | DeliverableArtifact;
}

export const MOCK_BANNER =
  "DRAFT — MOCK IMAGERY · NOT FOR DELIVERY · traced over development mock imagery";
