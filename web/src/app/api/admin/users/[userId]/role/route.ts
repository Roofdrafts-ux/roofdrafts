import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

const VALID: Role[] = ["CUSTOMER", "ESTIMATOR", "ADMIN"];

/** PATCH /api/admin/users/:userId/role — admin changes a user's role. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionWithRole("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  const role = body?.role as Role | undefined;

  if (!role || !VALID.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  // Guard: an admin cannot demote themselves (avoid locking out the last admin).
  if (userId === session.user.id && role !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot remove your own admin role." },
      { status: 422 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
