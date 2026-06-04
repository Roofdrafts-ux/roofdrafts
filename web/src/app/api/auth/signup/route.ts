import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getEmailer } from "@/lib/email";
import { getEmails, getSetting } from "@/lib/settings";
import { writeAudit } from "@/lib/audit";
import { createOrgForUser } from "@/lib/org";

const ACCOUNT_TYPES = new Set(["individual", "company"]);
const VOLUMES = new Set(["1-5", "5-20", "20+"]);

/** Notify the team about a new company lead (best-effort; never blocks signup). */
async function alertCompanyLead(lead: {
  name?: string | null;
  email: string;
  companyName?: string | null;
  monthlyVolume?: string | null;
}): Promise<void> {
  try {
    const recipients = await getEmails("lead_alert_emails");
    if (recipients.length === 0) return;

    const rows = [
      ["Name", lead.name ?? "—"],
      ["Email", lead.email],
      ["Company", lead.companyName ?? "—"],
      ["Monthly volume", lead.monthlyVolume ?? "—"],
    ];
    const subject = `New company lead: ${lead.companyName || lead.name || lead.email}`;
    const html =
      `<h2 style="font-family:sans-serif">New Roofdrafts company signup</h2>` +
      `<table style="font-family:sans-serif;border-collapse:collapse">` +
      rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777">${k}</td><td style="padding:4px 0"><b>${v}</b></td></tr>`).join("") +
      `</table><p style="font-family:sans-serif;color:#777">Follow up promptly — high-volume accounts are the priority lane.</p>`;
    const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

    const emailer = getEmailer();
    await Promise.all(recipients.map((to) => emailer.send({ to, subject, html, text })));
  } catch (e) {
    console.warn(`[signup] lead alert failed: ${(e as Error).message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Abuse-dampening: cap signups per IP (best-effort on serverless).
    const rl = rateLimit(`signup:${clientIp(req.headers)}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const { name, email: emailRaw, password, accountType, companyName, monthlyVolume } = body as {
      name?: string;
      email?: string;
      password?: string;
      accountType?: string;
      companyName?: string;
      monthlyVolume?: string;
    };

    // Normalize email so casing can't create duplicate/confusable accounts.
    const email = (emailRaw ?? "").trim().toLowerCase();

    // Normalize self-reported segmentation (never trusted for authz — display/routing only).
    const acct = accountType && ACCOUNT_TYPES.has(accountType) ? accountType : null;
    const isCompany = acct === "company";
    const company = isCompany && companyName?.trim() ? companyName.trim().slice(0, 120) : null;
    const volume = isCompany && monthlyVolume && VOLUMES.has(monthlyVolume) ? monthlyVolume : null;

    // ── Validate ──────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    // ── Create user + credentials account ─────────────────────────
    const hash = await bcrypt.hash(password, 12);

    // Bootstrap admins: emails in BOOTSTRAP_ADMIN_EMAILS get ADMIN on signup.
    // (ADMIN outranks ESTIMATOR, so these accounts can reach every console.)
    const bootstrapAdmins = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const role = bootstrapAdmins.includes(email.toLowerCase()) ? "ADMIN" : "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        role,
        accountType: acct,
        companyName: company,
        monthlyVolume: volume,
        leadStatus: isCompany ? "NEW" : null,
        leadStatusAt: isCompany ? new Date() : null,
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: email,
            access_token: hash, // hashed password stored here for credentials provider
          },
        },
      },
    });

    // Every customer gets an organization (individual = org-of-one; company = multi-member).
    const orgName = company || name?.trim() || email.split("@")[0];
    await createOrgForUser(user.id, orgName, isCompany ? "COMPANY" : "INDIVIDUAL");

    // ── Record consent (terms_v1) ─────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    await prisma.consentRecord.create({
      data: {
        userId: user.id,
        type: "terms_v1",
        ipAddress: ip,
        userAgent: ua,
      },
    });

    await writeAudit({
      actorId: user.id,
      actorEmail: email,
      action: "user.signup",
      targetType: "user",
      targetId: user.id,
      meta: { accountType: acct, companyName: company, monthlyVolume: volume, role },
      ip: ip === "unknown" ? null : ip,
    });

    // Company signups → alert the team for immediate follow-up (best-effort).
    if (isCompany) {
      await alertCompanyLead({ name: name ?? null, email, companyName: company, monthlyVolume: volume });
    }

    // Booking link for high-volume company leads — resolved server-side (gated, never public).
    const bookingUrl = isCompany && volume && volume !== "1-5" ? await getSetting("booking_url") : "";

    return NextResponse.json(
      { ok: true, accountType: acct, monthlyVolume: volume, bookingUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
