# Roofdrafts — DESIGN.md

## Theme
Draftsman's desk: cream drafting paper, clay ink, amber highlights, blueprint-navy panels for diagram surfaces. Light theme pinned. (Brand register keeps this verbatim from the prototype; product surfaces reuse the same tokens.)

## Color (tokens in `web/src/app/globals.css`, `--nj2-*` / `--tp-*`)
- Brand/accent (clay): `#BE5630` (`--tp-accent`), hover `#A2451F`, soft `#FBECE4`, ring `rgba(190,86,48,.30)`
- Amber highlight: `#E8B23A` (`--nj2-lime` — historic name, it is amber), deep `#B7791F`
- Page bg: cream `--nj2-bg-page` / card `--nj2-bg-card` / sunken `--nj2-bg-sunken` / muted `--nj2-bg-muted`
- Ink ramp: `--nj2-fg-1..4`, borders `--nj2-border`, `--nj2-border-subtle`, `--nj2-border-strong`
- Semantic: success `--nj2-success`, danger `--nj2-danger` (+`-soft`), warning amber family, info/blue `--tp-blue` (+`-soft`), navy `--tp-navy-3` (footer/blueprint panels)
- Diagram line palette (paper/blueprint) in `roofcalc.ts` `LINE_PALETTE`: ridge `#C2603A`, hip `#B7791F`, valley `#B23A2E`, rake `#3C7A52`, eave `#2A6076`, + report extras step `#2F8F83`, apron `#A14BB3`, box-gutter `#5B6B9E`

## Typography
- Display: Space Grotesk (`--nj2-font-display`) — headings, hero numerals
- Body/UI: Hanken Grotesk (`--nj2-font-body`)
- Mono: JetBrains Mono (`--nj2-font-mono`) — measurements, ids, labels, table data
- Logo wordmark only: Inter (`--nj2-font-logo`)
- Product register: fixed rem scale, ratio ~1.2; mono for data columns.

## Brand mark
"Carpenter's square roof" (see `RoofMark` in `primitives.tsx`; same geometry in `app/icon.svg`, `apple-icon.tsx`): clay rounded square (radius ~29%), hollow tongue left, solid ruler blade right with etched ticks, amber apex dot, arrowed dimension line. Wordmark: `roof` (ink) + `drafts` (muted), Inter 700.

## Recurring motifs
- Drafting-paper grids (`.tp-graph-fine`, auth shell grid) and dot grids
- Measured dimension lines with end ticks (DimAxis in diagrams; echoed in the logo)
- Mono uppercase micro-labels for metadata (used sparingly)
- Status chips: tinted bg + readable ink, shared across consoles (`.rd-badge-*`)

## Surfaces
- Marketing/auth: prototype-faithful, verbatim CSS (`globals.css` + per-area css files)
- Consoles: per-area CSS (`admin.css`, `dashboard.css`, `estimator.css`, `chat.css`, `report.css`) sharing the global tokens; cards rounded `--nj2-r-lg/2xl`, soft long shadows; tables dense with mono data
- Diagrams: SVG from real geometry only (roofcalc models / AppliCad exports)

## Motion
150–250ms ease-out; state feedback only in consoles; `prefers-reduced-motion` honored globally (`* { animation-duration: .01ms }` fallback).
