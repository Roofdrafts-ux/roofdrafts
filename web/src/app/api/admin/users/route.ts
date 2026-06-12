import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionWithRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { getEmailer } from "@/lib/email";
import { cleanEmail, cleanName, escapeHtml } from "@/lib/chat";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";
const ROLES = new Set(["CUSTOMER", "ESTIMATOR", "ADMIN"]);

/**
 * POST /api/admin/users — admin creates an account directly (team members,
 * or a customer on the phone). Generates a one-time temporary password,
 * emails it to the new user, and returns it ONCE so the admin can hand it
 * over if the email doesn't arrive. The user can also just use
 * "Continue with Google" if the address is a Google account.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionWithRole("ADMIN");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const { name: nameRaw, email: emailRaw, role: roleRaw } = raw as Record<string, unknown>;

  const email = cleanEmail(typeof emailRaw === "string" ? emailRaw.toLowerCase() : null);
  const name = cleanName(nameRaw);
  // Fail closed: an unrecognized role becomes CUSTOMER, never staff.
  const role = typeof roleRaw === "string" && ROLES.has(roleRaw) ? roleRaw : "CUSTOMER";
  if (!email) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists — change their role in the table instead." },
      { status: 409 }
    );
  }

  // 12-char URL-safe temporary password (~72 bits).
  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(tempPassword, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as "CUSTOMER" | "ESTIMATOR" | "ADMIN",
        // Temp password is a handoff, not their chosen one — nudge a change.
        mustChangePassword: true,
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: email,
            access_token: hash,
          },
        },
        // Org-of-one, same as self-serve signup.
        memberships: {
          create: {
            role: "OWNER",
            organization: { create: { name: name ?? email, type: "INDIVIDUAL" } },
          },
        },
      },
    });
  } catch (e) {
    // Race with a concurrent self-serve signup for the same email.
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "An account with that email already exists — change their role in the table instead." },
        { status: 409 }
      );
    }
    throw e;
  }

  await writeAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "user.create",
    targetType: "user",
    targetId: user.id,
    meta: { email, role },
  });

  // Best-effort welcome email with the temporary password.
  let emailed = false;
  try {
    const res = await getEmailer().send({
      to: email,
      subject: "Your Roofdrafts account",
      text:
        `${name ?? "Hi"}, an account was created for you on Roofdrafts (role: ${role.toLowerCase()}).\n\n` +
        `Sign in at ${APP_URL}/auth/signin\nEmail: ${email}\nTemporary password: ${tempPassword}\n\n` +
        `If this address is a Google account you can also use "Continue with Google".`,
      html:
        `<p>${escapeHtml(name ?? "Hi")}, an account was created for you on <b>Roofdrafts</b> ` +
        `(role: ${escapeHtml(role.toLowerCase())}).</p>` +
        `<p>Sign in at <a href="${APP_URL}/auth/signin">${APP_URL}/auth/signin</a><br/>` +
        `Email: <b>${escapeHtml(email)}</b><br/>` +
        `Temporary password: <code>${escapeHtml(tempPassword)}</code></p>` +
        `<p>If this address is a Google account you can also use “Continue with Google”.</p>`,
    });
    emailed = !!res.ok && !res.dryRun;
  } catch {
    /* admin still gets the password below */
  }

  return NextResponse.json(
    { user: { id: user.id, email, name, role }, tempPassword, emailed },
    { status: 201 }
  );
}
