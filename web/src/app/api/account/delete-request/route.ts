import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmails } from "@/lib/settings";
import { getEmailer } from "@/lib/email";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

/**
 * POST /api/account/delete-request — the signed-in user requests deletion of their account/data.
 * We DON'T hard-delete automatically (orders may have legal/retention needs); we record the
 * request (audit) and alert the team to process it. Honors GDPR/CCPA "right to erasure" intake.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  await writeAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "account.delete_request",
    targetType: "user",
    targetId: session.user.id,
    ip: ipFromHeaders(req.headers),
  });

  try {
    const recipients = await getEmails("lead_alert_emails");
    if (recipients.length) {
      await Promise.all(
        recipients.map((to) =>
          getEmailer().send({
            to,
            subject: `Account deletion request: ${session.user.email}`,
            html: `<div style="font-family:sans-serif"><h2>Account deletion request</h2>
              <p>User <b>${session.user.email}</b> (id ${session.user.id}) requested deletion of their account and data. Process within your SLA / regulatory window.</p></div>`,
            text: `Account deletion request from ${session.user.email} (id ${session.user.id}).`,
          })
        )
      );
    }
  } catch (e) {
    console.warn(`[delete-request] alert failed: ${(e as Error).message}`);
  }

  return NextResponse.json({ ok: true });
}
