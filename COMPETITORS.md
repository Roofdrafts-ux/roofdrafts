# Roofdrafts — Competitive Analysis

> Deep-research report (multi-source, adversarially verified: 25/25 claims confirmed, 0 refuted).
> Pricing/SLA/funding figures are time-sensitive — refreshed monthly by the
> "Roofdrafts — monthly competitor analysis" routine. Last full report: 2026-06.

## TL;DR
The market splits into **three archetypes**:

1. **Entrenched aerial-imagery incumbents** — EagleView, Nearmap. Own aircraft/drone fleets,
   automated AI + photogrammetry with human QA, deeply wired into the **insurance-claims stack**
   via Verisk Xactimate/XactAnalysis. EagleView claims **24 of the top 25 U.S. insurers**.
2. **Smartphone-capture / 3D-model** — Hover. Requires an on-site visit but delivers in **~2 hours**.
3. **Low-flat-rate, human-drafted report sellers** — AerialReports, Sketch My Roof, RoofScope.
   **This is Roofdrafts' direct competitive set**: manual CAD drafting + QA, PDF/ESX/XML deliverables,
   Verisk integration, per-report pricing **as low as $19**.

The market is **consolidating around insurance**: Verisk integration is now table-stakes distribution,
AI automation is the incumbents' efficiency lever, and ownership is concentrating in PE/strategics
(Thoma Bravo took Nearmap private for ~AUD $1.055B; Roofr raised a TCV/ABC Supply Series B).

**Roofdrafts' sharpest wedge:** *speed + trust at flat rate* — a 6–10 hr human-verified SLA beats
AerialReports' ~24h standard and aerial incumbents' 24–48h, while undercutting on price. But because
direct flat-rate rivals exist (Sketch My Roof $19, AerialReports $30+), GTM must lead with **verified
accuracy**, **native Xactimate ESX delivery**, and the **restoration/storm** segment.

---

## Competitor profiles

### EagleView — dominant aerial incumbent
- **Imagery:** own **aircraft + drones** (orthogonal + oblique); 3.5B+ images at up to 1-inch GSD.
- **Measurement:** automated **AI + photogrammetry**, cross-checked across angles, human QA. "Assess"
  product uses Skydio drones + ML damage detection.
- **Customers:** roofing contractors, insurance adjusters, solar installers.
- **Insurance moat:** supports **24 of the top 25 U.S. insurers**; Feb 2025 Verisk partnership lets users
  order "EagleView Assess Roof" inside Xactimate/XactAnalysis with 3D measurements + Sketch + imagery
  auto-uploaded.
- **Ownership:** PE-owned (Vista Equity Partners acquired it; has changed hands among PE owners).
- Sources: eagleview.com/aerial-roof-measurements, /eagleview-assess-..., /eagleview-and-verisk-join-forces, globenewswire 2025/02/03.

### Nearmap — proprietary aerial + AI, insurer-focused
- **Imagery:** proprietary aircraft capture + **3D-mesh measurement**.
- **Measurement:** AI geospatial detection — roof condition, damage, vegetation overhang.
- **Customers:** primarily **P&C insurers** (product-specific), plus government/AECO; also serves
  contractors via MapBrowser.
- **Integration:** delivered inside **Verisk XactAnalysis/Xactimate** or via API.
- **Ownership:** taken **private by Thoma Bravo (~AUD $1.055B, completed Dec 15 2022**, delisted from ASX).
- Sources: prnewswire (Nearmap P&C release), nearmap.com/solutions/roofing, thomabravo.com.

### Hover — smartphone capture, fastest turnaround
- **Capture:** **on-site smartphone photos** (contractor, crew, or homeowner) → 3D model.
- **Trade-off:** requires a site visit, but **~2 hr** turnaround vs 24–48h for aerial. Roof **and wall**
  measurements + visualization. (Beginning to add some aerial/address options.)
- Source: hover.to comparison blog (self-favorable framing; turnaround externally corroborated).

### AerialReports — direct flat-rate rival
- **Model:** human-delivered reports, **no subscription**. PDF + .ESX (Xactimate) + .XML (Symbility).
- **Pricing:** **$30** (≤25 sq), **$40** (≤50), **$50** (≤75), **+$10 / 25 sq**.
- **SLA:** ~24h standard; **~3–6h super-rush** (+~$40). → Roofdrafts' 6–10h sits between their standard and rush.
- Source: aerialreports.com/reports-pricing.

### Sketch My Roof — cheapest direct rival
- **Model:** per-report, **no subscriptions**. ESX + XML + PDF, delivered into **Xactimate + XactAnalysis**
  with **no additional Verisk charge to enable** the integration.
- **Pricing:** reports **start at $19**.
- Source: sketchmyroof.com/verisk.

### RoofScope — manual-CAD, human-in-the-loop (closest model to Roofdrafts)
- **Method:** each report **drawn by an expert CAD technician** + rigorous QA — *not* fully automated ML.
- **Integration:** API into **Verisk Xactimate** and **Cotality/CoreLogic Claims Workspace**.
- Source: roofscope.com/roofscope-xactimate-cotality-integration.

### Roofr — SaaS platform play
- **Model:** satellite measurement reports as a low-cost lead-in to a bundled **CRM/estimating/proposals**
  platform (lock-in via workflow, not reports).
- **Funding:** **Series B led by TCV** + distributor **ABC Supply**, Crosslink, Euclid, MGFO, i2BF (Jan 2025).
- Source: roofr.com/blog/roofr-raises-series-b-...

> **Thin/unverified this cycle:** GAF QuickMeasure, RoofSnap, Pitchgauge, Verisk/Geomni, SkyMeasure/CoreLogic,
> and Roofr's own measurement pricing did not survive standalone verification — flagged for next refresh.

---

## Pricing benchmarks (per report, current as of 2026-06; verify before quoting)
| Provider | Type | Price | SLA |
|----------|------|-------|-----|
| Sketch My Roof | flat-rate human | from **$19** | — |
| AerialReports | flat-rate human | **$30–$50+** (by squares) | ~24h std / 3–6h rush |
| EagleView / Nearmap | aerial incumbent | contact sales (premium) | 24–48h class |
| Hover | smartphone 3D | per-property | ~2h (site visit) |
| **Roofdrafts** | flat-rate human-verified | flat-rate (undercut) | **6–10h** |

## Where the market is heading
- **Insurance is the gravity well.** Verisk Xactimate/XactAnalysis integration is the table-stakes
  distribution channel; the EagleView–Verisk and Nearmap–Verisk tie-ins make it the default workflow.
- **AI automation** is the incumbents' efficiency lever (faster, cheaper extraction) — but "human-verified"
  remains a trust differentiator, especially for disputed insurance claims.
- **Consolidation** into PE/strategics (Thoma Bravo/Nearmap; ABC Supply backing Roofr).

## Differentiation & GTM for Roofdrafts
1. **Speed + trust at flat rate** — own the 6–10h human-verified lane: faster than flat-rate rivals'
   standard SLAs, cheaper than aerial incumbents, more defensible than raw AI.
2. **Native Xactimate ESX with no Verisk surcharge** — match Sketch My Roof's friction-free import; this
   is table stakes, not a differentiator, so it must be solid (note: our ESX is currently `DRAFT_UNVALIDATED`
   — validating against a licensed Xactimate import is a priority before insurance GTM).
3. **Lead with the restoration/storm contractor segment** — where fast, defensible, import-ready reports
   matter most and on-time guarantees win loyalty.
4. **Compete on accuracy proof** — publish the ±2% guarantee + human-QA sign-off as the wedge vs automated AI.

## Open questions (next refresh should close)
- Real per-report pricing/SLA for Roofr's measurement product, GAF QuickMeasure, RoofSnap, Pitchgauge.
- EagleView's current ownership/valuation (to complete the consolidation picture).
- Quantified accuracy / dispute-rework rates: automated-AI incumbents vs manual-CAD human-drafted providers.
- What Verisk charges report providers + certification requirements to deliver ESX into Xactimate/XactAnalysis
  (critical to Roofdrafts' distribution + unit economics).

## Caveats
Most product/pricing/integration facts come from **vendor primary sources** and were cross-checked where
possible, but self-reported figures (EagleView "24 of top 25", Nearmap accuracy/speed, Hover turnaround) are
marketing claims, not audited. Pricing is highly time-sensitive. Roofdrafts' 6–10h SLA is the framing premise,
not an independently sourced fact.

## Key sources
EagleView (aerial-roof-measurements, Assess, Verisk partnership) · Nearmap (P&C release, /solutions/roofing) ·
Hover (comparison blog) · AerialReports (/reports-pricing) · Sketch My Roof (/verisk) ·
RoofScope (xactimate-cotality-integration) · Thoma Bravo (Nearmap acquisition) · Roofr (Series B) ·
Vista Equity / EagleView (mergr) · Hover Series D (Crunchbase).
