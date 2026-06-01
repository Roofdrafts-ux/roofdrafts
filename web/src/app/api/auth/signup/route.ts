import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

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

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
