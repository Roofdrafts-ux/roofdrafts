import "server-only";
import { prisma } from "./prisma";

export interface AuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  /** Dotted key, e.g. "user.role.update", "setting.update", "order.status.update". */
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: unknown;
  ip?: string | null;
}

/** Append an audit record. Best-effort: never throws into the caller's flow. */
export async function writeAudit(a: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: a.actorId ?? null,
        actorEmail: a.actorEmail ?? null,
        action: a.action,
        targetType: a.targetType ?? null,
        targetId: a.targetId ?? null,
        meta: (a.meta ?? null) as object,
        ip: a.ip ?? null,
      },
    });
  } catch (e) {
    console.warn(`[audit] ${a.action} failed: ${(e as Error).message}`);
  }
}

/** Pull the client IP from request headers (best-effort). */
export function ipFromHeaders(h: Headers): string | null {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}
