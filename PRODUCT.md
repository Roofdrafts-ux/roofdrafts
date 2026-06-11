# Roofdrafts — PRODUCT.md

## Register
Split-register product:
- **Brand** surfaces: marketing site (`/`), `/report/sample`, auth pages. Design IS the product here; pixel-fidelity to the original prototype is a hard constraint (verbatim tokens/CSS).
- **Product** surfaces: `/admin/*` (owner console), `/estimator/*` (production staff), `/dashboard/*` (customers), `/measure` (tracing tool). Design SERVES the workflow; earned familiarity over novelty.

## Users
- **Owner/admin (Sunil)**: runs the whole business from `/admin` — orders pipeline, users/roles, leads, live chat, pricing, billing, audit. Often checking in quickly from a laptop between tasks; needs glanceable state ("what needs my attention now?").
- **Estimators**: claim orders, trace roofs, ship deliverables in `/estimator`. Deep-work tool, keyboard-heavy, information-dense.
- **Customers (roofers, restoration firms, independent adjusters)**: order reports, download deliverables in `/dashboard`. Low-frequency visitors; clarity beats density.
- **Anonymous visitors**: marketing + chat widget + sample report.

## Purpose
Turn a property address into an estimate-ready roof report (PDF/ESX/XML) in hours, checked by a human estimator. The consoles exist to keep the 6–10 hr turnaround promise visible and enforceable: everything in admin should answer "is anything about to miss SLA, and who's handling it?"

## Brand personality
Precise · technical-warm · trustworthy. The visual language is a draftsman's desk: drafting-paper grids, measured dimension lines, mono annotations, clay + amber on cream. Reports and diagrams are the hero artifacts; UI frames them.

## Anti-references
- Generic SaaS admin (gray sidebar, blue buttons, hero-metric cards).
- EagleView/competitor enterprise blandness.
- Crypto/startup gradient maximalism.
- AI-slop tells: identical card grids, eyebrow-on-every-section, side-stripe alerts.

## Accessibility
WCAG AA contrast minimums; keyboard reachable; `prefers-reduced-motion` honored. Mono numerals for data alignment.

## Strategic design principles
1. **Status is color-coded everywhere, with one shared vocabulary** (order pipeline, payments, roles, chat states) — a status chip looks the same on every screen.
2. **Derived truth only**: stats and trends come from real rows in the DB; never decorative fake numbers in product surfaces.
3. **Density with hierarchy**: tables can be dense, but each screen has one obvious primary question it answers at a glance.
4. **The drafting motif carries identity in product surfaces through small touches** (mono labels, measured dividers, the RoofMark) — not through decoration that slows tasks.
