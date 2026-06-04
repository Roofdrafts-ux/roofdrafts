import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { SETTINGS, setSetting } from "@/lib/settings";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

const BY_KEY = Object.fromEntries(SETTINGS.map((s) => [s.key, s]));
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const NUMERIC_RANGE: Record<string, [number, number]> = {
  company_volume_discount_pct: [0, 100],
  invoice_net_days: [0, 365],
};

function validate(key: string, value: string): string | null {
  const def = BY_KEY[key];
  if (!def) return `Unknown setting: ${key}`;
  const v = value.trim();
  if (v === "") return null; // empty clears → falls back to env/default
  if (NUMERIC_RANGE[key]) {
    const n = Number(v);
    const [min, max] = NUMERIC_RANGE[key];
    if (!Number.isFinite(n) || n < min || n > max) return `${def.label} must be a number between ${min} and ${max}`;
  }
  if (def.type === "boolean" && v !== "true" && v !== "false") return `${def.label} must be true/false`;
  if (def.type === "url" && !/^https?:\/\//i.test(v)) return `${def.label} must be a valid URL`;
  if (def.type === "emails" && !v.split(",").map((e) => e.trim()).filter(Boolean).every((e) => EMAIL_RE.test(e)))
    return `${def.label} contains an invalid email`;
  return null;
}

/** PATCH /api/admin/settings — admin updates one or more business settings. */
export async function PATCH(req: NextRequest) {
  const session = await getSessionWithRole("ADMIN");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const updates = body?.settings as Record<string, string> | undefined;
  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "Expected { settings: { key: value } }." }, { status: 400 });
  }

  for (const [key, value] of Object.entries(updates)) {
    const err = validate(key, String(value));
    if (err) return NextResponse.json({ error: err }, { status: 422 });
  }

  const changed: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    await setSetting(key, String(value).trim(), session.user.id);
    changed.push(key);
  }

  await writeAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "setting.update",
    targetType: "setting",
    targetId: changed.join(","),
    meta: { keys: changed },
    ip: ipFromHeaders(req.headers),
  });

  return NextResponse.json({ ok: true, changed });
}
