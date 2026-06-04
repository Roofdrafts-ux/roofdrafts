import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/orders";
import { formatUsd } from "@/lib/pricing";
import { getCurrentMembership, orgAtLeast } from "@/lib/org";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import Link from "next/link";
import "./dashboard.css";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Your reports — Roofdrafts" };
export const dynamic = "force-dynamic";

const REPORT_LABEL: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  "3d-esx": "3D / ESX",
};
const TURN_LABEL: Record<string, string> = {
  standard: "Standard · 6–10 hr",
  rush: "Rush · 3 hr",
  bulk: "Bulk · overnight",
};

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const membership = await getCurrentMembership(session.user.id);
  const canManageTeam = membership ? orgAtLeast(membership.role, "ADMIN") : false;
  const isCompany = membership?.orgType === "COMPANY";

  const orders = await prisma.order.findMany({
    where: membership
      ? { organizationId: membership.organizationId }
      : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { deliverables: true },
  });

  return (
    <div className="rd-dash">
      {/* Header */}
      <header className="rd-dash-header">
        <div className="rd-dash-header-inner">
          <Link href="/" className="rd-dash-brand">
            <span className="rd-dash-brand-roof">roof</span>
            <span className="rd-dash-brand-drafts">drafts</span>
          </Link>
          <div className="rd-dash-header-right">
            {membership && (
              <Link href="/dashboard/team" className="rd-dash-user" style={{ textDecoration: "none" }}>
                {membership.orgName} · Team
              </Link>
            )}
            {isCompany && canManageTeam && (
              <Link href="/dashboard/billing" className="rd-dash-user" style={{ textDecoration: "none" }}>
                Billing
              </Link>
            )}
            <span className="rd-dash-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="rd-dash-main">
        <div className="rd-dash-title-row">
          <div>
            <h1 className="rd-dash-h1">Your reports</h1>
            <p className="rd-dash-sub">
              {orders.length === 0
                ? "No orders yet — place your first report."
                : `${orders.length} ${orders.length === 1 ? "report" : "reports"}`}
            </p>
          </div>
          <Link href="/?order=1" className="nj2-btn nj2-btn-brand">
            + Order a report
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rd-dash-empty">
            <div className="rd-dash-empty-mark">⌂</div>
            <p className="rd-dash-empty-text">
              Your delivered PDF, Xactimate ESX and XML files will appear here.
            </p>
            <Link href="/?order=1" className="nj2-btn nj2-btn-brand">
              Order your first report
            </Link>
          </div>
        ) : (
          <div className="rd-order-list">
            {orders.map((o) => {
              const meta = STATUS_META[o.status as OrderStatus];
              return (
                <div key={o.id} className="rd-order-card">
                  <div className="rd-order-main">
                    <div className="rd-order-id">{o.displayId}</div>
                    <div className="rd-order-address">{o.address}</div>
                    <div className="rd-order-meta">
                      <span>{REPORT_LABEL[o.reportType] ?? o.reportType}</span>
                      <span className="rd-order-dot">·</span>
                      <span>{TURN_LABEL[o.turnaround] ?? o.turnaround}</span>
                      <span className="rd-order-dot">·</span>
                      <span>Ordered {fmtDate(o.createdAt)}</span>
                      <span className="rd-order-dot">·</span>
                      <span>{o.priceUsd != null ? formatUsd(o.priceUsd) : "—"}</span>
                    </div>
                  </div>

                  <div className="rd-order-side">
                    <div className="rd-order-badges">
                      <span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span>
                      <span
                        className={`rd-badge rd-badge-${o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "REFUNDED" ? "muted" : "warning"}`}
                      >
                        {o.paymentStatus === "PAID" ? "Paid" : o.paymentStatus === "REFUNDED" ? "Refunded" : "Unpaid"}
                      </span>
                    </div>
                    {!isCompany && o.paymentStatus === "UNPAID" && o.status !== "CANCELLED" && (
                      <Link href={`/dashboard/pay/${o.id}`} className="nj2-btn nj2-btn-brand nj2-btn-sm">
                        Pay {o.priceUsd != null ? formatUsd(o.priceUsd) : ""}
                      </Link>
                    )}
                    {isCompany && o.paymentStatus !== "PAID" && o.status !== "CANCELLED" && (
                      <span className="rd-order-eta">Billed via invoice</span>
                    )}
                    {o.status === "DELIVERED" && o.deliverables.length > 0 ? (
                      <div className="rd-order-files">
                        {o.deliverables.map((d) => (
                          <a
                            key={d.id}
                            href={d.url ?? "#"}
                            className="rd-file-btn"
                            aria-disabled={!d.url}
                          >
                            {d.type === "XACTIMATE_ESX" ? "ESX" : d.type}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="rd-order-eta">
                        {o.slaDueAt ? `ETA ${fmtDate(o.slaDueAt)}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
