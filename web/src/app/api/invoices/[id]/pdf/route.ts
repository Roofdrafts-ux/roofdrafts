import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orgAtLeast } from "@/lib/org";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

/** GET /api/invoices/:id/pdf — download an invoice (platform admin, or the org's own admins). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { organization: true, orders: { orderBy: { createdAt: "asc" } } },
  });
  if (!invoice) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Authorize: platform ADMIN, or an ADMIN/OWNER member of the invoice's org.
  let allowed = session.user.role === "ADMIN";
  if (!allowed) {
    const m = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: invoice.organizationId, userId: session.user.id } },
    });
    allowed = !!m && orgAtLeast(m.role, "ADMIN");
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bytes = await renderInvoicePdf({
    number: invoice.number,
    status: invoice.status,
    orgName: invoice.organization.name,
    createdAt: invoice.createdAt,
    dueAt: invoice.dueAt,
    subtotalUsd: invoice.subtotalUsd,
    discountUsd: invoice.discountUsd,
    totalUsd: invoice.totalUsd,
    lines: invoice.orders.map((o) => ({
      displayId: o.displayId,
      address: o.address,
      reportType: o.reportType,
      priceUsd: o.priceUsd ?? 0,
      date: o.createdAt,
    })),
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
