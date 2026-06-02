import "server-only";
import { xmlExporter } from "./xml";
import { esxExporter } from "./esx";
import { pdfExporter } from "./pdf";
import type { DeliverableKind, DeliverableArtifact, RoofReportData, Exporter } from "./types";

const EXPORTERS: Record<DeliverableKind, Exporter> = {
  XML: xmlExporter,
  XACTIMATE_ESX: esxExporter,
  PDF: pdfExporter,
};

export const ALL_KINDS: DeliverableKind[] = ["PDF", "XACTIMATE_ESX", "XML"];

/** Shape of the Order + RoofModel rows we read from. */
interface OrderLike {
  displayId: string;
  address: string;
  reportType: string;
}
interface RoofModelLike {
  totalSqFt: number;
  squares: number;
  predominantPitch: string;
  ridgeFt: number;
  hipFt: number;
  valleyFt: number;
  rakeFt: number;
  eaveFt: number;
  pitchData: unknown;
  isMock: boolean;
  summary?: string | null;
}

/** Build normalized report data from persisted rows. */
export function buildReportData(
  order: OrderLike,
  roof: RoofModelLike,
  generatedAt: Date
): RoofReportData {
  const facets = Array.isArray(roof.pitchData)
    ? (roof.pitchData as Array<{ id: string; pitch: number; planArea: number; area: number }>)
    : [];
  return {
    displayId: order.displayId,
    address: order.address,
    reportType: order.reportType,
    generatedAt: generatedAt.toISOString(),
    totalSqFt: roof.totalSqFt,
    squares: roof.squares,
    predominantPitch: roof.predominantPitch,
    lengths: {
      ridge: roof.ridgeFt,
      hip: roof.hipFt,
      valley: roof.valleyFt,
      rake: roof.rakeFt,
      eave: roof.eaveFt,
    },
    facets,
    isMock: roof.isMock,
    summary: roof.summary ?? null,
  };
}

export async function generateArtifact(
  kind: DeliverableKind,
  data: RoofReportData
): Promise<DeliverableArtifact> {
  return EXPORTERS[kind].generate(data);
}

export type { RoofReportData, DeliverableArtifact, DeliverableKind } from "./types";
