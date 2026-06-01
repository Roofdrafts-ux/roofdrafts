# Roofdrafts

Production web app for **aerial roof-measurement reports** — order by address, get a
human-verified roof diagram (area, squares, pitch, ridge/hip/valley/rake/eave) delivered
as **PDF + Xactimate ESX + XML** within a 6–10 hr SLA. (Business model akin to
EagleView / Hover / Roofr.)

Next.js 16 (App Router) · TypeScript · React 19 · Prisma 7 · Postgres (Supabase) ·
Auth.js v5 · Stripe · Resend. App lives in [`web/`](web/).

---

## Quick start

```bash
cd web
cp .env.example .env.local      # fill in the values (see below)
npm install
npx prisma generate
npm run dev                     # http://localhost:3000
npm test                        # 43 unit tests (geometry, state machine, pricing, email, deliverables)
```

> **Run it outside iCloud.** If the project lives under `~/Documents` (iCloud Drive),
> Turbopack can stall on file reads. Keep it somewhere like `~/dev/Roofdrafts`.

## Environment (`web/.env.local`)

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Supabase pooler URL (runtime) |
| `DIRECT_URL` | Supabase direct URL (migrations) |
| `AUTH_SECRET` | Auth.js secret — `openssl rand -base64 32` |
| `AUTH_URL` | App base URL (e.g. `http://localhost:3000`) |
| `BOOTSTRAP_ADMIN_EMAILS` | Comma-separated emails granted ADMIN on signup |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key — **omit to log emails to console (dev dry-run)** |
| `EMAIL_FROM` | From address for transactional email |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth |

Secrets live in `.env.local` only (gitignored) — never commit them.

## Roles & how to run each locally

Role-based access is enforced **server-side** (middleware → `proxy.ts` + `requireRole()`).

- **Customer** — sign up at `/auth/signup`. Place an order from the homepage flow,
  pay from `/dashboard`, download delivered files.
- **Estimator** — `/estimator` queue (SLA-sorted, live countdowns) → claim → trace the
  roof in the measure tool → save model → generate deliverables → advance status.
- **Admin** — `/admin` analytics, `/admin/users` role management, `/admin/pricing`.

To get your first admin/estimator: put your email in `BOOTSTRAP_ADMIN_EMAILS` then sign
up — ADMIN outranks ESTIMATOR, so it reaches every console. (Or `UPDATE users SET role=…`.)

## End-to-end lifecycle

```
Customer places order ──▶ PENDING  (email: received, auto-priced)
        │  pays (Stripe) ─────────▶ paymentStatus PAID (webhook, email: payment_received)
Estimator claims ────────▶ MODELING (email: in_production)
        │  traces + saves RoofModel
        └─ Send to QA ───▶ QA_REVIEW
                └─ Mark delivered ─▶ DELIVERED (email: delivered) ──▶ customer downloads PDF/ESX/XML
```

## Architecture notes

- **Geometry engine** (`src/lib/roofcalc.ts`) — models a roof as 3-D vertices; surface
  area via Newell's method, line lengths by true 3-D distance. The diagram is rendered
  *from* the model and the report numbers *derive from* it, so they can't disagree.
  Accuracy contract: `surfaceArea ≈ planArea × slopeFactor` per facet (unit-tested).
- **Deliverables** (`src/lib/deliverables/`) — typed `Exporter` interface; PDF (pdf-lib),
  ESX (zipped sketch, schema marked `DRAFT_UNVALIDATED` — real Xactimate compat is a
  separate licensed task), XML.
- **Mock safety** — imagery has a `MOCK` provider for dev. A model traced over mock
  imagery is flagged `isMock`; such orders **cannot be marked DELIVERED**, artifacts are
  watermarked, and customers are never served mock files. Enforced end to end + tested.
- **Design** — ported pixel-identical from the prototype (`_design_src/`); verbatim CSS
  tokens, Tailwind only for net-new surfaces.

## Testing

```bash
npm test          # vitest run (Node — no dev-server dependency)
npm run test:watch
```

Covers the geometry engine, the order state machine (incl. the mock-delivery block),
pricing/coverage, order helpers, email templates, and all three deliverable exporters.

## Legal

Legal pages ship as **DRAFTs** with a visible "DRAFT — pending legal review" banner until
counsel review.
