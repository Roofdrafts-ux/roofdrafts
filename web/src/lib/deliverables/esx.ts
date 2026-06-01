import "server-only";
import { zipSync, strToU8 } from "fflate";
import type { Exporter, RoofReportData, DeliverableArtifact } from "./types";

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Xactimate ESX exporter.
 *
 * An .ESX is a ZIP container holding an XML sketch Xactimate imports. The EXACT
 * Xactimate schema is a vendor-compatibility task requiring a real Xactimate
 * license to validate against — we DO NOT guess it. This produces a structured,
 * clearly-labeled sketch behind the Exporter interface so the pipeline is real;
 * swapping in the validated schema is a contained change here.
 */
export const esxExporter: Exporter = {
  kind: "XACTIMATE_ESX",
  generate(data: RoofReportData): DeliverableArtifact {
    const facetXml = data.facets
      .map(
        (f) =>
          `      <roof_face id="${esc(f.id)}" pitch="${round(f.pitch)}" ` +
          `area="${round(f.area)}" plan_area="${round(f.planArea)}"/>`
      )
      .join("\n");

    const sketchXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ROOFDRAFTS ESX SKETCH · draft serializer · schema NOT validated against
     a licensed Xactimate import. Vendor-compat is a separate task. -->
<XACTDOC schema_status="DRAFT_UNVALIDATED"${data.isMock ? ' mock="true"' : ""}>
  <PROJECT id="${esc(data.displayId)}">
    <PROPERTY address="${esc(data.address)}"/>
    <ROOF>
      <totals surface_sqft="${round(data.totalSqFt)}" squares="${round(data.squares)}"
              predominant_pitch="${esc(data.predominantPitch)}"/>
      <lengths ridge="${round(data.lengths.ridge)}" hip="${round(data.lengths.hip)}"
               valley="${round(data.lengths.valley)}" rake="${round(data.lengths.rake)}"
               eave="${round(data.lengths.eave)}"/>
${facetXml}
    </ROOF>
  </PROJECT>
</XACTDOC>
`;

    const manifest = JSON.stringify(
      {
        producer: "roofdrafts",
        format: "ESX-draft",
        validatedAgainstXactimate: false,
        mock: data.isMock,
        reportId: data.displayId,
        generatedAt: data.generatedAt,
      },
      null,
      2
    );

    const zipped = zipSync({
      "sketch.xml": strToU8(sketchXml),
      "manifest.json": strToU8(manifest),
      ...(data.isMock
        ? { "DRAFT-MOCK-DO-NOT-DELIVER.txt": strToU8("Traced over mock imagery. Not for delivery.") }
        : {}),
    });

    return {
      kind: "XACTIMATE_ESX",
      filename: `${data.displayId}${data.isMock ? "-DRAFT" : ""}.esx`,
      mimeType: "application/octet-stream",
      bytes: zipped,
      isMock: data.isMock,
    };
  },
};
