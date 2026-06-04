import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { generateInvoiceForOrg } from "@/lib/billing";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

/** POST /api/admin/invoices  body: { organizationId } — roll unbilled orders into a draft invoice. */
export async function POST(req: NextRequest) {
  const session = await getSessionWithRole("ADMIN");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const organizationId = String((await req.json().catch(() => ({})))?.organizationId ?? "");
  if (!organizationId) return NextResponse.json({ error: "organizationId required." }, { status: 400 });

  const invoice = await generateInvoiceForOrg(organizationId);
  if (!invoice) return NextResponse.json({ error: "No unbilled orders for this organization." }, { status: 422 });

  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "invoice.create",
    targetType: "invoice", targetId: invoice.id,
    meta: { number: invoice.number, organizationId, totalUsd: invoice.totalUsd, orders: invoice.orders.length },
    ip: ipFromHeaders(req.headers),
  });
  return NextResponse.json({ ok: true, invoice }, { status: 201 });
}
