import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_META } from "@/lib/orders";
import { MeasureTool } from "@/components/measure/MeasureTool";
import { StatusControls } from "@/components/estimator/StatusControls";
import { Countdown } from "@/components/estimator/Countdown";
import { DeliverablesPanel } from "@/components/estimator/DeliverablesPanel";
import { AiDraftButton } from "@/components/estimator/AiDraftButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../estimator.css";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { RoofModel } from "@/lib/roofcalc";

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
  const rm = order.roofModel;
  const initialModel = (rm?.modelData as RoofModel | null) ?? undefined;

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
              {rm
                ? `Model ${rm.aiDrafted ? "AI-drafted" : "saved"} · ${rm.squares.toFixed(1)} SQ · ${rm.predominantPitch}${rm.isMock ? " · MOCK" : ""}`
                : "No model yet — AI-draft it, or trace the roof and Save."}
            </div>
          </div>
          <div className="rd-est-workflow-actions">
            <AiDraftButton orderId={order.id} hasModel={!!rm} />
            <StatusControls orderId={order.id} status={order.status as OrderStatus} />
          </div>
        </div>

        {rm?.aiDrafted && (
          <div className="rd-est-workflow-inner" style={{ paddingTop: 0 }}>
            <div className="rd-ai-banner">
              ✨ <b>AI-drafted</b>{rm.confidence != null ? ` · ${Math.round(rm.confidence * 100)}% confidence` : ""}
              {rm.source ? ` · ${rm.source}` : ""} — review &amp; correct below, then <b>Save roof model</b> to
              verify. It can&apos;t advance to QA or delivery until a human verifies it.
            </div>
          </div>
        )}
        <div className="rd-est-workflow-inner" style={{ paddingTop: 0 }}>
          <DeliverablesPanel
            orderId={order.id}
            hasModel={!!order.roofModel}
            isMock={order.roofModel?.isMock ?? true}
            deliverables={order.deliverables.map((d) => ({ id: d.id, type: d.type, url: d.url }))}
          />
        </div>
      </div>

      {/* Measure tool wired to this order — seeded with the saved/AI-drafted model */}
      <MeasureTool
        key={rm?.updatedAt?.toISOString() ?? "blank"}
        orderId={order.id}
        orderDisplayId={order.displayId}
        orderAddress={order.address}
        initialModel={initialModel}
      />
    </div>
  );
}
