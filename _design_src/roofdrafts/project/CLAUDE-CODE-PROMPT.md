# Claude Code Build Prompt — Roofdrafts (roof-measurement reports SaaS)

Copy everything below the line into Claude Code as your opening prompt. Attach the
`index.html` (or the `Roofdrafts.html` + JSX/CSS source files) from this project so it
has the exact visual design to match.

---

## Project: Roofdrafts — aerial roof measurement reports

I'm building a production web app for a roof-measurement report service, similar in
business model to **PitchGauge**, **Roofr**, **Hover**, and **EagleView**. Contractors,
restoration firms, and insurance adjusters order a report for a property address; we
produce an accurate, estimate-ready roof diagram (area, squares, pitch, ridges, hips,
valleys) and deliver it as **PDF + Xactimate ESX + XML**, human-verified, in 6–10 hours.

I already have a **finished marketing site + order-flow prototype** (attached as
`index.html` / the React+JSX source). **Match its visual design exactly** — the brand,
type, color, and the SVG roof-diagram style. Treat it as the design system. Do **not**
restyle it; port it into the real app.

### Brand / design system (already defined — reuse verbatim)
- **Name:** Roofdrafts. Wordmark: "roof" in ink + "drafts" in muted grey, with a
  roof-peak tile mark.
- **Aesthetic:** "drafting table" — warm paper background, ink text, **clay/terracotta**
  primary accent (`#BE5630`), **blueprint navy** (`#0E2A38`) panels where roof linework
  lives in light cyan.
- **Type:** Space Grotesk (display), Hanken Grotesk (body), JetBrains Mono (measurements/IDs).
- **Tokens & components** are in the attached `tokens.css` / `styles.css` / `*.jsx`.
  Lift the buttons, cards, eyebrows, ledger hairlines, registration marks, and the
  `RoofPlanHero` / `RoofPlanCompact` SVG diagram components.

---

## Tech stack (use this unless you have a strong reason)
- **Next.js (App Router) + TypeScript + React**, deployed on **Vercel**.
- **Tailwind CSS** with the design tokens above mapped to the theme config.
- **Postgres** (Supabase or Neon) via **Prisma** ORM.
- **Auth:** Auth.js (NextAuth) or Clerk — email/password + Google, with roles
  (`customer`, `estimator`, `admin`).
- **File storage:** S3-compatible (Supabase Storage / Cloudflare R2) for delivered
  PDF/ESX/XML and uploaded imagery.
- **Payments:** Stripe (per-report charges + saved cards + invoicing for volume accounts).
- **Email:** Resend or Postmark (transactional: order received, ready, revisions).
- **Maps/Imagery:** Google Maps Static + Geocoding API for address → coordinates and a
  satellite preview (and as the base layer the estimator traces over).

---

## Roles & core flows

### 1. Public marketing site
Port the attached prototype as the marketing pages (hero, how-it-works, formats, SLA,
coverage, testimonials, pricing, FAQ, footer). Keep all copy and visuals. Make the
"Order a report" CTA route into the authenticated order flow (or guest checkout).

### 2. Customer
- **Sign up / sign in** (email + Google).
- **Place an order:** address autocomplete → satellite preview → report type
  (Residential / Commercial / 3D-ESX) → turnaround (Standard / Rush / Bulk) → notes →
  pay with Stripe (or "pay on delivery" for approved accounts).
- **Dashboard:** list of orders with status (Received → Modeling → QA → Delivered),
  report ID, address, ETA, and download buttons (PDF/ESX/XML) once delivered.
- **Order detail:** view the diagram, measurements summary, request a free revision,
  re-download files.
- **Billing:** saved payment methods, invoices, volume pricing.

### 3. Estimator (internal)
- **Production queue:** unclaimed + claimed orders, sorted by SLA deadline (with a
  visible countdown — speed is the product).
- **Measure tool:** open an order, see the satellite imagery, trace roof facets,
  ridges/hips/valleys, enter pitch per facet; the app computes area, squares, and line
  lengths. (MVP can be a manual trace tool on a canvas/Leaflet overlay; later, integrate
  an automated extraction step that the estimator only verifies.)
- **Generate deliverables:** export the diagram to a branded **PDF**, a valid
  **Xactimate ESX**, and **XML**. Mark QA-passed → triggers delivery email.

### 4. Admin
- Manage users/roles, pricing, coverage, accounts/teams, refunds, SLA reports,
  and a dashboard of volume, turnaround times, and on-time %.

---

## Data model (starting point)
- `User` (role, name, email, company, phone)
- `Account`/`Team` (for volume customers, shared billing)
- `Order` (id e.g. `RD-48213`, address, lat/lng, reportType, turnaround, status, notes,
  price, paymentStatus, slaDueAt, assignedEstimatorId, createdAt, deliveredAt)
- `Report` (orderId, measurements JSON {areaSqFt, squares, predominantPitch, ridges,
  hips, valleys, eaves, facets}, diagram data, fileUrls {pdf, esx, xml}, qaBy, qaAt)
- `Revision` (orderId, requestedBy, note, status)
- `Payment` (Stripe ids, amount, status)
- `WebhookEvent` / `AuditLog`

## Status state machine
`received → modeling → qa_review → delivered` (+ `revision_requested`, `on_hold`,
`cancelled`). Each transition writes an audit log and may fire an email + dashboard update.

---

## The hard part — be honest with me about it
The genuinely difficult piece is **producing the actual roof measurement**. Options,
cheapest → most advanced:
1. **Manual trace tool** (MVP): estimator traces the roof over satellite imagery; app does
   the geometry math. Reliable, no ML, matches our "human-verified" promise.
2. **Assisted:** pre-fill facet outlines from a building-footprint dataset or a
   roof-segmentation model, estimator corrects.
3. **Automated:** ML roof extraction from imagery + pitch estimation; human QA only.

Recommend a path and **start with #1** so we ship. Flag where licensing imagery
(Nearmap/Google/EagleView APIs) or ESX format compatibility will need real vendor
contracts or reverse-engineering, and don't fake those — stub them behind clear interfaces.

### Measurement-engine spec (use this exact logic — the prototype already implements it)
The attached prototype ships a working, correct geometry engine (`roofcalc.jsx`). Port its
logic to the real measure tool; do **not** invent your own math:

- **Model a roof as 3-D vertices in feet** (`[x, y, z]`, z = height above the eave plane).
  Facets are ordered vertex loops; edges are typed (`ridge | hip | valley | rake | eave`).
- **Facet surface area** via **Newell's method** on the 3-D vertices — this captures the
  slope automatically (no separate multiplier needed). Also keep the **plan (footprint)
  area** via shoelace on x,y for reporting.
- **Slope factor** (for display/QA) = `√(1 + (rise/run)²)` where pitch is `rise/12`. Verify
  `surfaceArea ≈ planArea × slopeFactor` per facet.
- **Roofing squares** = `totalSurfaceArea / 100` (1 square = 100 ft²).
- **Line lengths by type** = sum of **true 3-D distance** of each edge, grouped by type.
  A pure hip roof has 0 valleys/rakes; a gable has 0 hips — report only what exists.
- **Predominant pitch** = the pitch covering the most surface area.
- **Waste table:** suggest ordered area at 0 / 5 / 10 / 15 / 22 % over net squares.
- **Deliverable views** a real report needs: (1) **pitch diagram** (per-facet `X/12`),
  (2) **length diagram** (every edge dimensioned, color-coded by type with a legend),
  (3) **area diagram** (per-facet ft²), (4) totals table, (5) optional 3-D.
- **ESX export:** the `.ESX` is a zipped XML sketch Xactimate imports. Build a typed
  serializer behind an interface; validate against real Xactimate import. Treat exact
  schema as a vendor-compat task, not something to guess.
- **Accuracy contract:** carry a per-report tolerance (±2% area) and a QA sign-off record.

The estimator's manual trace tool should output exactly this model (vertices + typed
edges + per-facet pitch), then the same engine computes everything — so the diagram the
customer sees and the numbers on the report are guaranteed to agree, as in the prototype.

---

## Build order (phased)
1. **Phase 1 — Foundation:** Next.js app, design tokens → Tailwind, auth, DB schema,
   port the marketing site.
2. **Phase 2 — Ordering:** order flow + Stripe + Netlify-style form → real `Order`
   records + transactional email.
3. **Phase 3 — Customer dashboard:** order list/detail, statuses, file download, revisions.
4. **Phase 4 — Estimator console:** queue + manual measure tool + PDF/ESX/XML export + QA.
5. **Phase 5 — Admin & polish:** pricing/coverage/users, analytics, SLA reporting, tests.

## Non-negotiables
- TypeScript strict, sensible folder structure, environment variables for all secrets.
- Role-based access control enforced server-side (not just hidden UI).
- Match the attached design exactly; reuse its components and the SVG diagram style.
- Seed data + a README explaining setup, env vars, and how to run each role locally.

Start with **Phase 1**: scaffold the project, wire the design tokens, and port the
marketing homepage so it looks pixel-identical to the attached `index.html`. Then pause
and show me before continuing.
