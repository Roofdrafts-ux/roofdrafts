import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/orders";
import { AdminNav } from "@/components/admin/AdminNav";
import { relTime, fmtUsd, typeMeta, initials, avatarBucket } from "@/lib/admin-format";
import Link from "next/link";
import "./admin.css";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Admin — Roofdrafts" };
export const dynamic = "force-dynamic";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING", "MODELING", "QA_REVIEW", "DELIVERED",
  "REVISION_REQUESTED", "ON_HOLD", "CANCELLED",
];
const ACTIVE: OrderStatus[] = ["PENDING", "MODELING", "QA_REVIEW", "REVISION_REQUESTED"];

export default async function AdminDashboardPage() {
  const session = await requireRole("ADMIN");
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    totalOrders, weekOrders, delivered, grouped, recent,
    paidAgg, billedAgg, openChats, unreadChats, overdue, unassigned,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
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
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { priceUsd: true } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { priceUsd: true } }),
    prisma.chatThread.count({ where: { status: "OPEN" } }),
    prisma.chatThread.count({ where: { status: "OPEN", unreadForTeam: { gt: 0 } } }),
    prisma.order.findMany({
      where: { status: { in: ACTIVE }, slaDueAt: { lt: now } },
      orderBy: { slaDueAt: "asc" },
      take: 5,
      select: { id: true, displayId: true, address: true, slaDueAt: true },
    }),
    prisma.order.count({ where: { status: { in: ACTIVE }, assignedEstimatorId: null } }),
  ]);

  const countByStatus = new Map<string, number>(grouped.map((g) => [g.status, g._count._all]));
  const onTime = delivered.filter(
    (o) => o.deliveredAt && o.slaDueAt && o.deliveredAt.getTime() <= o.slaDueAt.getTime()
  ).length;
  const onTimePct = delivered.length === 0 ? null : Math.round((onTime / delivered.length) * 100);
  const paidUsd = paidAgg._sum.priceUsd ?? 0;
  const outstandingUsd = Math.max(0, (billedAgg._sum.priceUsd ?? 0) - paidUsd);
  const needsAttention = overdue.length > 0 || unreadChats > 0 || unassigned > 0;

  return (
    <div className="rd-admin">
      <AdminNav active="overview" user={session.user.name ?? session.user.email} />

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Overview</h1>
        <p className="rd-admin-lede">
          The business at a glance — pipeline health, money, and anything about to miss the
          turnaround promise.
        </p>

        {needsAttention && (
          <div className="rd-attn">
            <p className="rd-attn-title">Needs attention</p>
            {overdue.map((o) => (
              <div className="rd-attn-row" key={o.id}>
                <span className="rd-mono">{o.displayId}</span>
                <span>past its SLA ({o.slaDueAt ? relTime(o.slaDueAt, now) : ""}) — {o.address}</span>
                <Link href="/admin/orders">assign or update</Link>
              </div>
            ))}
            {unreadChats > 0 && (
              <div className="rd-attn-row">
                <span>
                  {unreadChats} chat conversation{unreadChats > 1 ? "s" : ""} waiting on a reply
                </span>
                <Link href="/admin/chat">open the inbox</Link>
              </div>
            )}
            {unassigned > 0 && (
              <div className="rd-attn-row">
                <span>
                  {unassigned} active order{unassigned > 1 ? "s" : ""} with no estimator assigned
                </span>
                <Link href="/admin/orders">assign now</Link>
              </div>
            )}
          </div>
        )}

        {/* KPI tiles */}
        <div className="rd-kpi-grid">
          <Kpi
            href="/admin/orders"
            ico="orders"
            label="Orders"
            value={String(totalOrders)}
            sub={<><b>+{weekOrders}</b> in the last 7 days</>}
            icon={<IcoOrders />}
          />
          <Kpi
            href="/admin/billing"
            ico="revenue"
            label="Revenue collected"
            value={fmtUsd(paidUsd)}
            sub={<><b>{fmtUsd(outstandingUsd)}</b> outstanding</>}
            icon={<IcoRevenue />}
          />
          <Kpi
            href="/admin/orders?status=DELIVERED"
            ico="sla"
            label="On-time delivery"
            value={onTimePct === null ? "—" : `${onTimePct}%`}
            warn={onTimePct !== null && onTimePct < 90}
            sub={<>of <b>{delivered.length}</b> delivered with an SLA</>}
            icon={<IcoSla />}
          />
          <Kpi
            href="/admin/chat"
            ico="chat"
            label="Open chats"
            value={String(openChats)}
            sub={unreadChats > 0 ? <><b>{unreadChats}</b> unread</> : <>all caught up</>}
            icon={<IcoChat />}
          />
        </div>

        {/* Pipeline */}
        <section className="rd-admin-section">
          <h2 className="rd-admin-h2">
            Pipeline <span className="rd-admin-count">{totalOrders} total</span>
          </h2>
          {totalOrders > 0 && (
            <div className="rd-stackbar" role="img" aria-label="Order pipeline share by status">
              {ALL_STATUSES.filter((s) => (countByStatus.get(s) ?? 0) > 0).map((s) => (
                <Link
                  key={s}
                  href={`/admin/orders?status=${s}`}
                  className={`rd-seg-${STATUS_META[s].tone}`}
                  style={{ flexGrow: countByStatus.get(s) ?? 0 }}
                  title={`${STATUS_META[s].label}: ${countByStatus.get(s)} — view orders`}
                  aria-label={`${STATUS_META[s].label}: ${countByStatus.get(s)} orders`}
                />
              ))}
            </div>
          )}
          <div className="rd-pipeline">
            {ALL_STATUSES.map((s) => {
              const meta = STATUS_META[s];
              const n = countByStatus.get(s) ?? 0;
              return (
                <Link
                  key={s}
                  href={`/admin/orders?status=${s}`}
                  className={`rd-pipeline-cell ${n === 0 ? "rd-pipeline-cell-zero" : ""}`}
                >
                  <span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span>
                  <span className="rd-pipeline-n">{n}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent orders */}
        <section className="rd-admin-section">
          <h2 className="rd-admin-h2">Recent orders</h2>
          {recent.length === 0 ? (
            <div className="rd-empty-state">
              <p className="rd-empty-state-title">No orders yet</p>
              <p className="rd-empty-state-hint">
                New orders from the website land here the moment a customer submits one.
              </p>
            </div>
          ) : (
            <table className="rd-admin-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Address</th>
                  <th>Customer</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => {
                  const meta = STATUS_META[o.status as OrderStatus];
                  const t = typeMeta(o.reportType);
                  const who = o.user.name ?? o.user.email;
                  return (
                    <tr key={o.id}>
                      <td className="rd-mono">{o.displayId}</td>
                      <td><span className={`rd-type ${t.cls}`}>{t.label}</span></td>
                      <td>{o.address}</td>
                      <td>
                        <span className="rd-id">
                          <span className={`rd-avatar rd-av-${avatarBucket(o.user.email)}`}>
                            {initials(o.user.name, o.user.email)}
                          </span>
                          <span className="rd-id-name">{who}</span>
                        </span>
                      </td>
                      <td className="rd-num">{fmtUsd(o.priceUsd)}</td>
                      <td>
                        <span className={`rd-pay ${o.paymentStatus === "PAID" ? "rd-pay-paid" : o.paymentStatus === "REFUNDED" ? "rd-pay-refund" : "rd-pay-unpaid"}`}>
                          {o.paymentStatus === "PAID" ? "paid" : o.paymentStatus === "REFUNDED" ? "refunded" : "unpaid"}
                        </span>
                      </td>
                      <td><span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span></td>
                      <td className="rd-rel">{relTime(o.createdAt, now)}</td>
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

function Kpi({
  ico, label, value, sub, warn, icon, href,
}: {
  ico: string;
  label: string;
  value: string;
  sub?: React.ReactNode;
  warn?: boolean;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="rd-kpi">
      <div className="rd-kpi-top">
        <span className={`rd-kpi-ico rd-kpi-ico-${ico}`}>{icon}</span>
        <span className="rd-kpi-label">{label}</span>
      </div>
      <div className={`rd-kpi-value ${warn ? "rd-kpi-warn" : ""}`}>{value}</div>
      {sub && <div className="rd-kpi-sub">{sub}</div>}
    </Link>
  );
}

/* 14px stroke icons, currentColor */
function IcoOrders() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M16 13H8M16 17H8" />
    </svg>
  );
}
function IcoRevenue() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function IcoSla() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
function IcoChat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
