import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/orders";
import { Countdown } from "@/components/estimator/Countdown";
import { ClaimButton } from "@/components/estimator/ClaimButton";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import Link from "next/link";
import "./estimator.css";
import type { OrderStatus } from "@/generated/prisma/enums";
import { RoofMark } from "@/components/primitives";

export const metadata = { title: "Production queue — Roofdrafts" };

const REPORT_LABEL: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  "3d-esx": "3D / ESX",
};

export default async function EstimatorQueuePage() {
  const session = await requireRole("ESTIMATOR");

  // Unclaimed work, soonest SLA first.
  const unclaimed = await prisma.order.findMany({
    where: {
      assignedEstimatorId: null,
      status: { in: ["PENDING", "MODELING", "REVISION_REQUESTED"] },
    },
    orderBy: { slaDueAt: "asc" },
  });

  // My active work.
  const mine = await prisma.order.findMany({
    where: {
      assignedEstimatorId: session.user.id,
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    orderBy: { slaDueAt: "asc" },
    include: { roofModel: true },
  });

  return (
    <div className="rd-est">
      <header className="rd-est-header" data-theme="dark">
        <div className="rd-est-header-inner">
          <Link href="/" className="rd-est-brand">
            <RoofMark size={24} />
            <span className="rd-est-brand-roof">roof</span>
            <span className="rd-est-brand-drafts">drafts</span>
            <span className="rd-est-tag">estimator</span>
          </Link>
          <div className="rd-est-header-right">
            <span className="rd-est-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="rd-est-main">
        {/* My active work */}
        <section>
          <h2 className="rd-est-h2">
            Your queue <span className="rd-est-count">{mine.length}</span>
          </h2>
          {mine.length === 0 ? (
            <p className="rd-est-empty">No claimed orders. Claim one from the pool below.</p>
          ) : (
            <div className="rd-est-list">
              {mine.map((o) => {
                const meta = STATUS_META[o.status as OrderStatus];
                return (
                  <Link key={o.id} href={`/estimator/${o.id}`} className="rd-est-row rd-est-row-link">
                    <div className="rd-est-row-main">
                      <span className="rd-est-id">{o.displayId}</span>
                      <span className="rd-est-address">{o.address}</span>
                      <span className="rd-est-sub">
                        {REPORT_LABEL[o.reportType] ?? o.reportType}
                        {o.roofModel ? " · model saved" : " · no model"}
                        {o.roofModel?.isMock ? " (MOCK)" : ""}
                      </span>
                    </div>
                    <div className="rd-est-row-side">
                      <span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span>
                      <Countdown dueAt={o.slaDueAt ? o.slaDueAt.toISOString() : null} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Unclaimed pool */}
        <section style={{ marginTop: 36 }}>
          <h2 className="rd-est-h2">
            Unclaimed pool <span className="rd-est-count">{unclaimed.length}</span>
          </h2>
          {unclaimed.length === 0 ? (
            <p className="rd-est-empty">Pool is clear. Nice work.</p>
          ) : (
            <div className="rd-est-list">
              {unclaimed.map((o) => {
                const meta = STATUS_META[o.status as OrderStatus];
                return (
                  <div key={o.id} className="rd-est-row">
                    <div className="rd-est-row-main">
                      <span className="rd-est-id">{o.displayId}</span>
                      <span className="rd-est-address">{o.address}</span>
                      <span className="rd-est-sub">
                        {REPORT_LABEL[o.reportType] ?? o.reportType} · {o.turnaround}
                      </span>
                    </div>
                    <div className="rd-est-row-side">
                      <span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span>
                      <Countdown dueAt={o.slaDueAt ? o.slaDueAt.toISOString() : null} />
                      <ClaimButton orderId={o.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
