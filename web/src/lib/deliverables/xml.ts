import "server-only";
import type { Exporter, RoofReportData, DeliverableArtifact } from "./types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** Roofdrafts roof-measurement XML — open, vendor-neutral schema. */
export const xmlExporter: Exporter = {
  kind: "XML",
  generate(data: RoofReportData): DeliverableArtifact {
    const facetXml = data.facets
      .map(
        (f) =>
          `    <Facet id="${esc(f.id)}" pitch="${round(f.pitch)}/12" ` +
          `planAreaSqFt="${round(f.planArea)}" surfaceAreaSqFt="${round(f.area)}"/>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<RoofMeasurementReport schema="roofdrafts.v1"${data.isMock ? ' status="DRAFT_MOCK"' : ""}>
  <Meta>
    <ReportId>${esc(data.displayId)}</ReportId>
    <Address>${esc(data.address)}</Address>
    <ReportType>${esc(data.reportType)}</ReportType>
    <GeneratedAt>${esc(data.generatedAt)}</GeneratedAt>
    <Mock>${data.isMock ? "true" : "false"}</Mock>
  </Meta>
  <Totals>
    <SurfaceAreaSqFt>${round(data.totalSqFt)}</SurfaceAreaSqFt>
    <Squares>${round(data.squares)}</Squares>
    <PredominantPitch>${esc(data.predominantPitch)}</PredominantPitch>
  </Totals>
  <LineLengthsFt>
    <Ridge>${round(data.lengths.ridge)}</Ridge>
    <Hip>${round(data.lengths.hip)}</Hip>
    <Valley>${round(data.lengths.valley)}</Valley>
    <Rake>${round(data.lengths.rake)}</Rake>
    <Eave>${round(data.lengths.eave)}</Eave>
  </LineLengthsFt>
  <Facets count="${data.facets.length}">
${facetXml}
  </Facets>
</RoofMeasurementReport>
`;

    return {
      kind: "XML",
      filename: `${data.displayId}${data.isMock ? "-DRAFT" : ""}.xml`,
      mimeType: "application/xml",
      bytes: new TextEncoder().encode(xml),
      isMock: data.isMock,
    };
  },
};
