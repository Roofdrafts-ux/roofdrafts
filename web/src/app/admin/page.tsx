import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/orders";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import Link from "next/link";
import "./admin.css";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Admin — Roofdrafts" };

const ALL_STATUSES: OrderStatus[] = [
  "PENDING", "MODELING", "QA_REVIEW", "DELIVERED",
  "REVISION_REQUESTED", "ON_HOLD", "CANCELLED",
];

export default async function AdminDashboardPage() {
  const session = await requireRole("ADMIN");

  const [totalOrders, totalUsers, delivered, grouped, recent] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.findMany({
      where: { status: "DELIVERED", deliveredAt: { not: null }, slaDueAt: { not: null } },
      select: { deliveredAt: true, slaDueAt: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  const countByStatus = new Map<string, number>(
    grouped.map((g) => [g.status, g._count._all])
  );

  // On-time %: delivered at or before SLA deadline.
  const onTime = delivered.filter(
    (o) => o.deliveredAt && o.slaDueAt && o.deliveredAt.getTime() <= o.slaDueAt.getTime()
  ).length;
  const onTimePct = delivered.length === 0 ? null : Math.round((onTime / delivered.length) * 100);

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
            <Link href="/admin" className="rd-admin-navlink rd-admin-navlink-active">Overview</Link>
            <Link href="/admin/users" className="rd-admin-navlink">Users</Link>
            <span className="rd-admin-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Overview</h1>

        {/* KPI cards */}
        <div className="rd-kpi-grid">
          <Kpi label="Total orders" value={String(totalOrders)} />
          <Kpi label="Delivered" value={String(countByStatus.get("DELIVERED") ?? 0)} />
          <Kpi
            label="On-time delivery"
            value={onTimePct === null ? "—" : `${onTimePct}%`}
            tone={onTimePct !== null && onTimePct < 90 ? "warn" : "ok"}
          />
          <Kpi label="Users" value={String(totalUsers)} />
        </div>

        {/* Status breakdown */}
        <section className="rd-admin-section">
          <h2 className="rd-admin-h2">Pipeline</h2>
          <div className="rd-pipeline">
            {ALL_STATUSES.map((s) => {
              const meta = STATUS_META[s];
              const n = countByStatus.get(s) ?? 0;
              return (
                <div key={s} className="rd-pipeline-cell">
                  <span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span>
                  <span className="rd-pipeline-n">{n}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent orders */}
        <section className="rd-admin-section">
          <h2 className="rd-admin-h2">Recent orders</h2>
          {recent.length === 0 ? (
            <p className="rd-admin-empty">No orders yet.</p>
          ) : (
            <table className="rd-admin-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Address</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => {
                  const meta = STATUS_META[o.status as OrderStatus];
                  return (
                    <tr key={o.id}>
                      <td className="rd-mono">{o.displayId}</td>
                      <td>{o.address}</td>
                      <td className="rd-dim">{o.user.name ?? o.user.email}</td>
                      <td><span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rd-kpi">
      <div className="rd-kpi-label">{label}</div>
      <div className={`rd-kpi-value ${tone === "warn" ? "rd-kpi-warn" : ""}`}>{value}</div>
    </div>
  );
}
