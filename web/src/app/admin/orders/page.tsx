import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/AdminNav";
import { AssignSelect } from "@/components/admin/AssignSelect";
import { STATUS_META } from "@/lib/orders";
import "../admin.css";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Orders — Roofdrafts admin" };
export const dynamic = "force-dynamic";

const fmtSla = (d: Date | null) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function AdminOrdersPage() {
  const session = await requireRole("ADMIN");

  const [orders, staff, workload] = await Promise.all([
    prisma.order.findMany({
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
  ]);

  const estimators = staff.map((s) => ({ id: s.id, label: s.name ?? s.email }));
  const labelById = new Map(estimators.map((e) => [e.id, e.label]));
  const wl = workload
    .map((w) => ({ label: labelById.get(w.assignedEstimatorId ?? "") ?? "—", n: w._count._all }))
    .sort((a, b) => b.n - a.n);
  const unassignedActive = orders.filter((o) => !o.assignedEstimatorId && !["DELIVERED", "CANCELLED"].includes(o.status)).length;

  return (
    <div className="rd-admin">
      <AdminNav active="orders" user={session.user.name ?? session.user.email} />
      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Orders</h1>

        <div style={{ display: "flex", gap: 10, margin: "4px 0 22px", flexWrap: "wrap" }}>
          <div style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--nj2-border-subtle,#e5e0d6)", background: unassignedActive ? "var(--nj2-brand-50,#FBECE4)" : "#fff" }}>
            <div style={{ fontSize: 11, color: "var(--nj2-fg-3,#888)" }}>UNASSIGNED ACTIVE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: unassignedActive ? "var(--nj2-brand-600,#A2451F)" : "inherit" }}>{unassignedActive}</div>
          </div>
          {wl.map((w) => (
            <div key={w.label} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--nj2-border-subtle,#e5e0d6)" }}>
              <div style={{ fontSize: 11, color: "var(--nj2-fg-3,#888)" }}>{w.label.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{w.n}</div>
            </div>
          ))}
        </div>

        <table className="rd-admin-table">
          <thead>
            <tr><th>Report</th><th>Address</th><th>Customer</th><th>Status</th><th>Model</th><th>SLA</th><th>Assigned</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const meta = STATUS_META[o.status as OrderStatus];
              const model = !o.roofModel
                ? "—"
                : o.roofModel.isMock ? "mock" : o.roofModel.aiDrafted ? "AI draft" : "verified";
              return (
                <tr key={o.id}>
                  <td className="rd-mono">{o.displayId}</td>
                  <td>{o.address}</td>
                  <td className="rd-dim">
                    {o.organization?.type === "COMPANY" ? `${o.organization.name}` : (o.user.name ?? o.user.email)}
                  </td>
                  <td><span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span></td>
                  <td className="rd-dim">{model}</td>
                  <td className="rd-dim">{fmtSla(o.slaDueAt)}</td>
                  <td><AssignSelect orderId={o.id} current={o.assignedEstimatorId} estimators={estimators} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </div>
  );
}
