import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/AdminNav";
import { AssignSelect } from "@/components/admin/AssignSelect";
import { STATUS_META } from "@/lib/orders";
import { fmtUsd, typeMeta, initials, avatarBucket, relTime } from "@/lib/admin-format";
import Link from "next/link";
import "../admin.css";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Orders — Roofdrafts admin" };
export const dynamic = "force-dynamic";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING", "MODELING", "QA_REVIEW", "DELIVERED",
  "REVISION_REQUESTED", "ON_HOLD", "CANCELLED",
];

function slaCell(d: Date | null, status: OrderStatus, now: Date) {
  if (!d || ["DELIVERED", "CANCELLED"].includes(status)) return <span className="rd-rel">—</span>;
  const label = new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const msLeft = d.getTime() - now.getTime();
  if (msLeft < 0) return <span className="rd-rel rd-sla-late">{label} · late</span>;
  if (msLeft < 2 * 3600 * 1000) return <span className="rd-rel rd-sla-soon">{label}</span>;
  return <span className="rd-rel">{label}</span>;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireRole("ADMIN");
  const now = new Date();
  const { status } = await searchParams;
  const filter = ALL_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : null;
  const where: Prisma.OrderWhereInput = filter ? { status: filter } : {};

  const [orders, staff, workload, counts, unassignedActive] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        user: { select: { name: true, email: true } },
        assignedEstimator: { select: { name: true, email: true } },
        roofModel: { select: { isMock: true, aiDrafted: true } },
        organization: { select: { name: true, type: true } },
      },
    }),
    prisma.user.findMany({ where: { role: { in: ["ESTIMATOR", "ADMIN"] } }, select: { id: true, name: true, email: true } }),
    prisma.order.groupBy({
      by: ["assignedEstimatorId"],
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] }, assignedEstimatorId: { not: null } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.count({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] }, assignedEstimatorId: null },
    }),
  ]);

  const countByStatus = new Map<string, number>(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((s, c) => s + c._count._all, 0);
  const estimators = staff.map((s) => ({ id: s.id, label: s.name ?? s.email }));
  const labelById = new Map(estimators.map((e) => [e.id, e.label]));
  const wl = workload
    .map((w) => ({ label: labelById.get(w.assignedEstimatorId ?? "") ?? "—", n: w._count._all }))
    .sort((a, b) => b.n - a.n);

  return (
    <div className="rd-admin">
      <AdminNav active="orders" user={session.user.name ?? session.user.email} />
      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Orders</h1>
        <p className="rd-admin-lede">
          Every report order, newest first. Assign estimators here; the SLA column flags anything
          due within two hours or already late.
        </p>

        {/* Estimator workload */}
        <div className="rd-wl-row">
          <div className={`rd-wl ${unassignedActive ? "rd-wl-alert" : ""}`}>
            <div className="rd-wl-label">Unassigned active</div>
            <div className="rd-wl-n">{unassignedActive}</div>
          </div>
          {wl.map((w) => (
            <div key={w.label} className="rd-wl">
              <div className="rd-wl-label">{w.label}</div>
              <div className="rd-wl-n">{w.n}</div>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div className="rd-filterbar">
          <Link href="/admin/orders" className={`rd-filter ${!filter ? "rd-filter-active" : ""}`}>
            All <span className="rd-filter-n">{total}</span>
          </Link>
          {ALL_STATUSES.map((s) => {
            const n = countByStatus.get(s) ?? 0;
            if (n === 0 && filter !== s) return null;
            return (
              <Link
                key={s}
                href={`/admin/orders?status=${s}`}
                className={`rd-filter ${filter === s ? "rd-filter-active" : ""}`}
              >
                {STATUS_META[s].label} <span className="rd-filter-n">{n}</span>
              </Link>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <div className="rd-empty-state">
            <p className="rd-empty-state-title">Nothing with this status</p>
            <p className="rd-empty-state-hint">Pick another filter above, or All to see everything.</p>
          </div>
        ) : (
          <table className="rd-admin-table">
            <thead>
              <tr>
                <th>Report</th><th>Type</th><th>Address</th><th>Customer</th>
                <th style={{ textAlign: "right" }}>Price</th><th>Pay</th><th>Status</th>
                <th>Model</th><th>SLA</th><th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const meta = STATUS_META[o.status as OrderStatus];
                const t = typeMeta(o.reportType);
                const customer = o.organization?.type === "COMPANY"
                  ? o.organization.name
                  : (o.user.name ?? o.user.email);
                const model = !o.roofModel
                  ? <span className="rd-dim">—</span>
                  : o.roofModel.isMock
                    ? <span className="rd-badge rd-badge-muted">mock</span>
                    : o.roofModel.aiDrafted
                      ? <span className="rd-badge rd-badge-warning">AI draft</span>
                      : <span className="rd-badge rd-badge-success">verified</span>;
                return (
                  <tr key={o.id}>
                    <td className="rd-mono" title={`placed ${relTime(o.createdAt, now)}`}>{o.displayId}</td>
                    <td><span className={`rd-type ${t.cls}`}>{t.label}</span></td>
                    <td>{o.address}</td>
                    <td>
                      <span className="rd-id">
                        <span className={`rd-avatar rd-av-${avatarBucket(o.user.email)}`}>
                          {initials(o.user.name, o.user.email)}
                        </span>
                        <span className="rd-id-name">{customer}</span>
                      </span>
                    </td>
                    <td className="rd-num">{fmtUsd(o.priceUsd)}</td>
                    <td>
                      <span className={`rd-pay ${o.paymentStatus === "PAID" ? "rd-pay-paid" : o.paymentStatus === "REFUNDED" ? "rd-pay-refund" : "rd-pay-unpaid"}`}>
                        {o.paymentStatus === "PAID" ? "paid" : o.paymentStatus === "REFUNDED" ? "ref" : "due"}
                      </span>
                    </td>
                    <td><span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span></td>
                    <td>{model}</td>
                    <td>{slaCell(o.slaDueAt, o.status as OrderStatus, now)}</td>
                    <td><AssignSelect orderId={o.id} current={o.assignedEstimatorId} estimators={estimators} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
