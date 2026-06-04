import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { setInvoiceStatus } from "@/lib/billing";
import { getEmailer } from "@/lib/email";
import { writeAudit, ipFromHeaders } from "@/lib/audit";
import type { InvoiceStatus } from "@/generated/prisma/enums";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";
const VALID: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "VOID"];

/** POST /api/admin/invoices/:id/status  body: { status } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionWithRole("ADMIN");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const status = (await req.json().catch(() => ({})))?.status as InvoiceStatus;
  if (!VALID.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const invoice = await setInvoiceStatus(id, status);
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

  // On SEND, notify the org's owner (best-effort).
  if (status === "SENT") {
    try {
      const owner = await prisma.organizationMember.findFirst({
        where: { organizationId: invoice.organizationId, role: "OWNER" },
        include: { user: { select: { email: true, name: true } } },
      });
      if (owner?.user?.email) {
        await getEmailer().send({
          to: owner.user.email,
          subject: `Invoice ${invoice.number} from Roofdrafts`,
          html: `<div style="font-family:sans-serif"><h2>Invoice ${invoice.number}</h2>
            <p>Amount due: <b>$${(invoice.totalUsd / 100).toFixed(2)}</b></p>
            <p><a href="${APP_URL}/dashboard/billing">View &amp; download your invoice</a></p></div>`,
          text: `Invoice ${invoice.number} — $${(invoice.totalUsd / 100).toFixed(2)}. View at ${APP_URL}/dashboard/billing`,
        });
      }
    } catch (e) {
      console.warn(`[invoice] send email failed: ${(e as Error).message}`);
    }
  }

  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "invoice.status",
    targetType: "invoice", targetId: id, meta: { status }, ip: ipFromHeaders(req.headers),
  });
  return NextResponse.json({ ok: true, invoice });
}
