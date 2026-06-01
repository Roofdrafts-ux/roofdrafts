import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/orders";
import { MeasureTool } from "@/components/measure/MeasureTool";
import { StatusControls } from "@/components/estimator/StatusControls";
import { Countdown } from "@/components/estimator/Countdown";
import { DeliverablesPanel } from "@/components/estimator/DeliverablesPanel";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../estimator.css";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Measure — Roofdrafts" };

export default async function EstimatorOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireRole("ESTIMATOR");
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { roofModel: true, deliverables: true },
  });
  if (!order) notFound();

  const meta = STATUS_META[order.status as OrderStatus];

  return (
    <div className="rd-est">
      <header className="rd-est-header">
        <div className="rd-est-header-inner">
          <Link href="/estimator" className="rd-est-back">← Queue</Link>
          <div className="rd-est-order-head">
            <span className="rd-est-id">{order.displayId}</span>
            <span className={`rd-badge rd-badge-${meta.tone}`}>{meta.label}</span>
            <Countdown dueAt={order.slaDueAt ? order.slaDueAt.toISOString() : null} />
          </div>
        </div>
      </header>

      {/* Status / workflow bar */}
      <div className="rd-est-workflow">
        <div className="rd-est-workflow-inner">
          <div className="rd-est-workflow-info">
            <div className="rd-est-workflow-addr">{order.address}</div>
            <div className="rd-est-workflow-meta">
              {order.roofModel
                ? `Model saved · ${order.roofModel.squares.toFixed(1)} SQ · ${order.roofModel.predominantPitch}${order.roofModel.isMock ? " · MOCK" : ""}`
                : "No model saved yet — trace the roof, then Save."}
            </div>
          </div>
          <StatusControls orderId={order.id} status={order.status as OrderStatus} />
        </div>
        <div className="rd-est-workflow-inner" style={{ paddingTop: 0 }}>
          <DeliverablesPanel
            orderId={order.id}
            hasModel={!!order.roofModel}
            isMock={order.roofModel?.isMock ?? true}
            deliverables={order.deliverables.map((d) => ({ id: d.id, type: d.type, url: d.url }))}
          />
        </div>
      </div>

      {/* Measure tool wired to this order */}
      <MeasureTool
        orderId={order.id}
        orderDisplayId={order.displayId}
        orderAddress={order.address}
      />
    </div>
  );
}
