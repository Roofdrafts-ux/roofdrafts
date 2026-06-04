# CLAUDE.md — Roofdrafts project guide

Standing instructions for any Claude session working in this repo. Read before making changes.

## What this is
Roofdrafts — a production web app for **aerial roof-measurement reports** (compete with
EagleView / Hover / Roofr). Customers order a report by address; a geometry engine computes
area / squares / pitch / ridge·hip·valley·rake·eave; reports are human-verified and delivered
as **PDF + Xactimate ESX + XML** within a 6–10 hr SLA.

App lives in [`web/`](web/) — Next.js 16 (App Router) · TypeScript · React 19 · Prisma 7 ·
Postgres (Supabase) · Auth.js v5 · Stripe · Resend. Prototype design source in `_design_src/`.
Governing briefs: `CLAUDE-CODE-PROMPT-v2.md` + `MASTER-PLAN.md` (the original v1 prompt lives at
`_design_src/roofdrafts/project/CLAUDE-CODE-PROMPT.md`).

## Non-negotiables (do not violate)
1. **Pixel-perfect prototype fidelity.** Port the prototype design exactly. Use **verbatim CSS +
   design tokens** for any UI that matches the prototype; Tailwind only for genuinely net-new surfaces.
2. **No Indian names or content** in any sample/seed/marketing copy (names, cities, etc.).
3. **Secrets in env only — never in chat, never committed.** `.env.local` is gitignored; `.env.example`
   documents keys with no values. Never paste real credentials into the conversation or code.
4. **Legal pages are DRAFTs** with a visible "DRAFT — pending legal review" banner until counsel review.
5. **Server-side RBAC.** Enforce roles (`CUSTOMER | ESTIMATOR | ADMIN`) on the server
   (`requireRole`, `getSessionWithRole`, proxy/middleware) — never rely on hidden UI alone.
6. **Mock imagery / ESX must be flagged and never shipped as real.** Imagery has a MOCK provider for
   dev. A model traced over mock imagery is `isMock=true`; such orders cannot be marked DELIVERED,
   artifacts are watermarked, and customers are never served mock files. ESX schema is marked
   `DRAFT_UNVALIDATED` (real Xactimate compat is a separate licensed task — do not fake it).
7. **Pause after each phase for review** — don't blast through phases unprompted.

## Architecture notes
- **Geometry engine** (`web/src/lib/roofcalc.ts`) — roof as 3-D vertices; surface area via Newell's
  method; line lengths by true 3-D distance. Diagram renders FROM the model; report numbers DERIVE
  from it, so they can't disagree. Accuracy contract: `surfaceArea ≈ planArea × slopeFactor` per facet.
- **Auth** — split config: `auth.config.ts` is Edge-safe (no DB/Node imports) for `src/proxy.ts`
  (Next 16 renamed middleware→proxy); full `auth.ts` (PrismaAdapter + providers) is Node-only for API.
- **Prisma 7** — datasource URLs live in `prisma.config.ts`, NOT `schema.prisma`. Client generated to
  `src/generated/prisma/` (gitignored → regenerated via `postinstall: prisma generate`). `prisma.ts`
  and `stripe.ts` are **lazy-init via Proxy** so importing never throws at build when env is absent.
- **Deliverables** (`web/src/lib/deliverables/`) — typed `Exporter` interface; PDF (pdf-lib),
  ESX (zipped sketch via fflate), XML. All `server-only`.
- **Pure/testable modules** (no `server-only`): `pricing.ts`, `coverage.ts`, `order-status.ts`.

## Conventions
- **Repo lives OUTSIDE iCloud** (`~/dev/Roofdrafts`). Running `next dev` / `next build` from an
  iCloud-synced path (`~/Documents`) stalls Turbopack on file reads.
- **GitHub**: remote is `Roofdrafts-ux/roofdrafts`. Push as the **Roofdrafts-ux** account only —
  never RSinvoicing/Iviraapp. Repo git identity is pinned to Roofdrafts-ux.
- **Commits**: end messages with `Co-Authored-By: Claude ...`. Branch off main only if asked to commit/push.
- **Tests**: `npm test` (Vitest, runs in Node — independent of the dev server). Keep them green.
- **Verify builds with `next build` locally** before relying on CI; tsc alone misses CSS-import and
  prerender (`useSearchParams` needs `<Suspense>`) errors.

## Deployment (Netlify)
- Base dir `web`, build `npm run build` (= `prisma generate && next build`), publish `.next`,
  `@netlify/plugin-nextjs`, Node 20 (see `web/netlify.toml`).
- `web/.npmrc` sets `legacy-peer-deps=true` (next-auth@5-beta peers next@^14||^15 but we run next@16).
- Required runtime env: `DATABASE_URL` (pooler/6543), `DIRECT_URL` (direct/5432), `AUTH_SECRET`,
  `AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `BOOTSTRAP_ADMIN_EMAILS`. Optional: `RESEND_API_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Custom domain `roofdrafts.com` via Netlify DNS (registrar nameservers → `dns1–4.p02.nsone.net`).
- First admin: add the email to `BOOTSTRAP_ADMIN_EMAILS`; it gets ADMIN on signup (ADMIN outranks ESTIMATOR).

## Brand & logo
- **Wordmark** = "roof" + "drafts" (second word in a muted tone) next to the `RoofMark` icon. The
  reusable component is `Wordmark` in `src/components/primitives.tsx` (`size` prop scales icon + text).
- **Logo font**: `--nj2-font-logo` = **Inter** (Stripe-style neo-grotesque), weight **700**, tracking
  `-0.022em`. Loaded via the Google Fonts `@import` in `globals.css`. Use this var for ALL brand
  wordmarks — do NOT revert the logo to `--nj2-font-display` (Space Grotesk stays for headings only).
- **Sizing (industry-standard, prominent header logo)**: nav `Wordmark size={42}`, footer `size={34}`.
  CSS wordmarks: auth `28px`, dashboard `24px`, estimator/admin `23px`. Keep the logo noticeably
  larger than nav/body text so it stands out.
- **Colors**: primary clay `--nj2-brand-500 #BE5630`; "roof" uses ink, "drafts" the muted ink tone.
- **Favicon**: `src/app/icon.svg` (clay rounded square + white roof glyph) + `src/app/apple-icon.tsx`
  (PNG via `ImageResponse`, since the apple-icon convention needs raster). No `favicon.ico`.

## Admin control plane (build in progress — phased)
Target: full B2B control plane. Tenancy model = **every customer gets an Organization** (individuals =
org-of-one; companies = multi-member). Billing = per-report (individuals) + consolidated **invoicing**
(companies). Phases: 1 Foundation ✓ · 2 Tenancy ✓ · 3 Billing ✓ · 4 Governance/ops.
- **Login routing**: `/go` (server) sends each role home (ADMIN→/admin, ESTIMATOR→/estimator, else
  /dashboard). signin/signup default `callbackUrl` = `/go`; explicit callbackUrl (invite) preserved.
- **Billing** (`lib/billing.ts`, `Invoice` model + `Order.invoiceId`): individuals pay per-report at
  checkout (unchanged); **companies are invoiced** — admin `/admin/billing` rolls an org's unbilled
  orders into a DRAFT `Invoice` (volume discount + net-days from Settings), then Send/Mark-paid/Void.
  Customer view `/dashboard/billing` (org ADMIN+); invoice PDF at `/api/invoices/[id]/pdf` (`lib/invoice-pdf`).
  Company orders show "Billed via invoice" instead of a Pay button. Audit: invoice.create/status.
- ⚠️ GOTCHA: two *different* dynamic slug names at one path level (`[id]` vs `[token]`) build fine
  locally but 500 every route at runtime on Netlify. Keep one slug name per level (we hit this once).
- **Tenancy** (`lib/org.ts`): `Organization` / `OrganizationMember` (OWNER>ADMIN>MEMBER, `orgAtLeast`) /
  `Invitation`. Every signup creates an org (`createOrgForUser`); orders carry `organizationId` and are
  listed org-scoped. Active org = `org_id` cookie → OWNER org → first (`getCurrentMembership`). Team UI
  at `/dashboard/team`; invite→email→`/invite/[token]` accept (email must match); last-owner protection;
  `/api/org/{invitations,members,switch}`. `/invite` is in the proxy PUBLIC list. Audit: member.invite,
  invite.accept/revoke, member.role.update, member.remove.
- **Settings** (`lib/settings.ts`, `Setting` table, `/admin/settings`): owner-editable business config,
  resolves DB → env → default. Registry = `SETTINGS[]`. NEVER store secrets here (env only).
  Wired: `lead_alert_emails` (company-signup alerts), `order_emails_enabled` (notify.ts gate),
  `booking_url` (returned by signup API server-side → gated, never `NEXT_PUBLIC`).
- **Audit** (`lib/audit.ts` `writeAudit`, `AuditLog` table, `/admin/audit`): append-only log of
  privileged actions. Already hooked: `user.signup`, `user.role.update`, `setting.update`. Add a
  `writeAudit(...)` call to every new privileged mutation.

## Status
Phases 1–5 complete (marketing, geometry+measure tool, auth/RBAC/Stripe/consent/dashboard, estimator
console + deliverables, admin + pricing/coverage + tests) plus payment + transactional email + live
Netlify deploy. See git log on `main`.
