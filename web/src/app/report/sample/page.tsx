// Roof Summary — sample report rendered from a real AppliCad export.
// Demonstrates the end-to-end pipeline: vendor XML → parsed geometry →
// measured plan + report tables (totals verified against the vendor PDF).
import { Wordmark } from "@/components/primitives";
import { RoofPlanFromXml } from "@/components/report/RoofPlanFromXml";
import { parseAppliCad, summarizeRoof, EDGE_ROWS } from "@/lib/applicad";
import { SAMPLE_ROOF_XML } from "@/data/sample-roof";
import { ftIn, commas } from "@/lib/roofcalc";
import "../report.css";

export const metadata = { title: "Sample roof report — Roofdrafts" };

const ADDRESS = "13 Rivers Run Way, Oak Ridge, TN 37830";
const ORDER_ID = "RD-50713";

export default function SampleReportPage() {
  const roof = parseAppliCad(SAMPLE_ROOF_XML);
  const s = summarizeRoof(roof);

  const sq = (n: number) => `${(n / 100).toFixed(2)} SQ`;
  const sf = (n: number) => `${commas(Math.round(n))} ft²`;

  return (
    <div className="rd-rep-page">
      <div className="rd-rep-sheet">
        <header className="rd-rep-head">
          <Wordmark size={34} />
          <div className="rd-rep-head-right">
            <div className="rd-rep-title">Roof Summary</div>
            <div className="rd-rep-sub">
              Structure 1 · {ADDRESS}
            </div>
          </div>
        </header>

        <div className="rd-rep-grid">
          <div className="rd-rep-diagram tp-graph-fine">
            <RoofPlanFromXml roof={roof} />
          </div>

          <aside className="rd-rep-measures" aria-label="Roof measurements">
            <div className="rd-rep-row">
              <span className="rd-rep-row-label">Roof area</span>
              <span className="rd-rep-row-value">{s.totalAreaSf.toFixed(2)} ft²</span>
            </div>
            <div className="rd-rep-row">
              <span className="rd-rep-row-label">Roof squares</span>
              <span className="rd-rep-row-value">{s.squares.toFixed(2)} SQ</span>
            </div>
            <div className="rd-rep-row">
              <span className="rd-rep-row-label">Predominant pitch</span>
              <span className="rd-rep-row-value">{s.predominantPitch}</span>
            </div>
            <div className="rd-rep-row">
              <span className="rd-rep-row-label">Facets</span>
              <span className="rd-rep-row-value">{s.facetCount}</span>
            </div>
            <div className="rd-rep-row">
              <span className="rd-rep-row-label">Perimeter</span>
              <span className="rd-rep-row-value">{ftIn(s.perimeterLf)}</span>
            </div>
            {EDGE_ROWS.map(([type, label]) => {
              const lf = s.edgeLf[type];
              if (!lf) return null;
              return (
                <div className="rd-rep-row" key={type}>
                  <span className="rd-rep-row-label">{label}</span>
                  <span className="rd-rep-row-value">{ftIn(lf)}</span>
                </div>
              );
            })}
          </aside>
        </div>

        <div className="rd-rep-tables">
          <div>
            <p className="rd-rep-table-title">Waste factors</p>
            <div className="rd-rep-table-card">
              <table className="rd-rep-table">
                <thead>
                  <tr>
                    <th>Waste</th>
                    {s.wasteRows.map((w) => (
                      <th key={w.pct}>{w.pct}%</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Area</td>
                    {s.wasteRows.map((w) => (
                      <td key={w.pct}>{sf(w.areaSf)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Squares</td>
                    {s.wasteRows.map((w) => (
                      <td key={w.pct}>{w.squares.toFixed(2)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="rd-rep-table-title">Area by pitch</p>
            <div className="rd-rep-table-card">
              <table className="rd-rep-table">
                <thead>
                  <tr>
                    <th>Pitch</th>
                    {s.pitchRows.map((p) => (
                      <th key={p.label}>
                        {p.label} ({Math.round(p.pct)}%)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Area</td>
                    {s.pitchRows.map((p) => (
                      <td key={p.label}>{sf(p.areaSf)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Squares</td>
                    {s.pitchRows.map((p) => (
                      <td key={p.label}>{p.squares.toFixed(2)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="rd-rep-foot">
          <span className="rd-rep-order">Order #: {ORDER_ID}</span>
          <p className="rd-rep-disclaimer">
            The waste factors in this Roofdrafts report are a general guideline based on total
            square footage and the complexity of the roof structure. Actual waste varies with the
            contractor&apos;s installation methods, jobsite practices, and other contributing
            factors — final material quantities should be confirmed by the installing crew.
            Measurements derive from a 3D model traced from aerial imagery and verified by a human
            estimator to a ±2% area tolerance.
          </p>
        </footer>
      </div>
    </div>
  );
}
