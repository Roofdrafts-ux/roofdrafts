import { requireRole } from "@/lib/auth-helpers";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import {
  REPORT_PRICES,
  formatUsd,
  REPORT_TYPE_LABEL,
  TURNAROUND_LABEL,
} from "@/lib/pricing";
import { COVERAGE } from "@/lib/coverage";
import Link from "next/link";
import "../admin.css";

export const metadata = { title: "Pricing & coverage — Roofdrafts admin" };

const TYPES = ["residential", "commercial", "3d-esx"] as const;
const TURNS = ["standard", "rush", "bulk"] as const;

export default async function AdminPricingPage() {
  const session = await requireRole("ADMIN");

  return (
    <div className="rd-admin">
      <header className="rd-admin-header">
        <div className="rd-admin-header-inner">
          <Link href="/" className="rd-admin-brand">
            <span className="rd-admin-brand-roof">roof</span>
            <span className="rd-admin-brand-drafts">drafts</span>
            <span className="rd-admin-tag">admin</span>
          </Link>
          <nav className="rd-admin-nav">
            <Link href="/admin" className="rd-admin-navlink">Overview</Link>
            <Link href="/admin/leads" className="rd-admin-navlink">Leads</Link>
            <Link href="/admin/orders" className="rd-admin-navlink">Orders</Link>
            <Link href="/admin/users" className="rd-admin-navlink">Users</Link>
            <Link href="/admin/pricing" className="rd-admin-navlink rd-admin-navlink-active">Pricing</Link>
            <Link href="/admin/billing" className="rd-admin-navlink">Billing</Link>
            <Link href="/admin/settings" className="rd-admin-navlink">Settings</Link>
            <Link href="/admin/audit" className="rd-admin-navlink">Audit</Link>
            <span className="rd-admin-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Pricing &amp; coverage</h1>

        <section className="rd-admin-section">
          <h2 className="rd-admin-h2">Price matrix</h2>
          <table className="rd-admin-table">
            <thead>
              <tr>
                <th>Report type</th>
                {TURNS.map((t) => (
                  <th key={t}>{TURNAROUND_LABEL[t]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((ty) => (
                <tr key={ty}>
                  <td style={{ fontWeight: 600 }}>{REPORT_TYPE_LABEL[ty]}</td>
                  {TURNS.map((t) => {
                    const cents = REPORT_PRICES[`${ty}_${t}` as keyof typeof REPORT_PRICES];
                    return (
                      <td key={t} className="rd-mono">
                        {cents ? formatUsd(cents) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rd-admin-note">
            Bulk is a per-property unit price for 10+ properties. Defined in
            <code> src/lib/pricing.ts</code> — edit there to change tiers.
          </p>
        </section>

        <section className="rd-admin-section">
          <h2 className="rd-admin-h2">Coverage <span className="rd-admin-count">{COVERAGE.length}</span></h2>
          <table className="rd-admin-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Code</th>
                <th>Imagery tier</th>
              </tr>
            </thead>
            <tbody>
              {COVERAGE.map((r) => (
                <tr key={r.code}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td className="rd-mono">{r.code}</td>
                  <td>
                    <span className={`rd-badge rd-badge-${r.imageryTier === "premium" ? "success" : "info"}`}>
                      {r.imageryTier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
