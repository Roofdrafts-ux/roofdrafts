# AI-Assisted Measurement Pipeline (plan)

Goal: AI auto-drafts the roof model; a **Roofdrafts employee verifies/edits it in the estimator
dashboard** before the report is delivered. "Never raw AI" — a human always signs off.

## Placement & RBAC
- Lives entirely in the **employee/estimator surface** (`/estimator`, `/estimator/[orderId]`),
  gated by `requireRole("ESTIMATOR")` + proxy. **Customers/insurance/agencies never see it** —
  they only order and receive the finished, human-verified report.
- AI drafting runs server-side (estimator-triggered or auto on order create), then the existing
  **MeasureTool** loads the drafted model for human verify/edit.

## Core principle (unchanged)
AI produces the **`RoofModel`** (verts + typed edges + per-facet pitch). The deterministic
`roofcalc.ts` engine computes all numbers from it; exporters render every format from it.
AI is an *input stage*; the math and the formats stay audited and deterministic.

## Flow
```
Order placed → (AI draft) RoofModel + confidence  [status: AI_DRAFTED / aiDrafted=true]
   estimator opens in MeasureTool (pre-filled, not blank)
   ├─ high confidence → quick verify → Approve
   └─ low confidence  → edit facets/edges/pitch → Approve
   Approve → aiDrafted=false, verifiedBy/verifiedAt set  → QA → deliver
corrections logged → training data → AI improves
```

## New pieces
- **Roof-extraction interface** `src/lib/roof-extraction/` (mirrors the imagery-provider pattern):
  - `RoofExtractor { extract(address, scene): Promise<{ model, confidence, source, isMock }> }`
  - `MockExtractor` — deterministic draft from a seed (works with no API key, for dev/demo)
  - `GoogleSolarExtractor` — calls **Google Solar API (Building Insights)**; maps
    `roofSegmentSummaries` (pitch/azimuth/area/bbox) → `RoofModel`. Needs `GOOGLE_SOLAR_API_KEY` (env).
  - Provider selected by env, same as imagery `MOCK` provider.
- **Schema** (`RoofModel`): `aiDrafted Boolean @default(false)`, `confidence Float?`,
  `verifiedById String?`, `verifiedAt DateTime?`.
- **API**: `POST /api/orders/:id/ai-draft` (estimator-only) → run extractor → upsert RoofModel
  (`aiDrafted=true`, confidence, `isMock` = imagery is mock). `POST …/verify` → `aiDrafted=false`,
  stamp verifier.
- **Estimator UI** (`/estimator/[orderId]`): "AI-draft roof" button (when no model); on a drafted
  model show an **"AI-drafted — verify before QA"** banner + confidence; **Approve/verify** action.
  MeasureTool gains an `initialModel` prop so it loads the draft instead of the blank template.
- **Guardrail**: extend `validateTransition` — cannot enter `QA_REVIEW`/`DELIVERED` while
  `aiDrafted` is true (must be human-verified first), in addition to the existing `isMock` block.

## Data sources (real, behind the interface — added later via env)
- Imagery: Google Aerial/Static, Nearmap, Vexcel, EagleView Imagery API.
- Geometry/pitch: **Google Solar API** (fast win, US coverage), USGS 3DEP LiDAR (DSM),
  oblique photogrammetry (COLMAP/OpenDroneMap) for premium.
- Footprints: Microsoft Building Footprints, Google Open Buildings. Segmentation: SAM2 / RID-trained.

## LLMs vs CV
- Geometry → specialized CV / Solar API, **not** LLMs.
- LLMs for: report narrative, damage detection from photos, parsing insurance claim PDFs, QA assist.
  Never generate ESX/XML per-report with an LLM — keep those deterministic, validated templates.

## Build order
1. MOCK-backed slice end-to-end (extractor interface + MockExtractor + ai-draft/verify API +
   estimator UI + MeasureTool prefill + guardrail). Demoable with **no external key**.
2. `GoogleSolarExtractor` (plug in `GOOGLE_SOLAR_API_KEY`) → real auto-measurements.
3. Confidence-based auto-routing; correction logging for training.
4. Validate ESX against a licensed Xactimate import before insurance GTM.
