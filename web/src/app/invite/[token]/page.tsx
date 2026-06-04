import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AcceptInvite } from "@/components/AcceptInvite";
import Link from "next/link";
import "../../auth/auth.css";

export const metadata = { title: "Invitation — Roofdrafts" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  const valid =
    invite &&
    invite.status === "PENDING" &&
    (!invite.expiresAt || invite.expiresAt.getTime() >= Date.now());

  const session = await auth();
  const emailMatches =
    valid && session?.user && (session.user.email ?? "").toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="rd-auth-shell">
      <div className="rd-auth-card">
        <div className="rd-auth-brand">
          <span className="rd-auth-brand-roof">roof</span>
          <span className="rd-auth-brand-drafts">drafts</span>
        </div>

        {!valid ? (
          <>
            <h1 className="rd-auth-heading">Invitation unavailable</h1>
            <p className="rd-auth-sub">This invitation is invalid, revoked, or has expired. Ask your admin to send a new one.</p>
            <Link href="/" className="rd-auth-link">← Back to Roofdrafts</Link>
          </>
        ) : (
          <>
            <h1 className="rd-auth-heading">Join {invite!.organization.name}</h1>
            <p className="rd-auth-sub">
              You&apos;ve been invited to collaborate on roof reports as <b>{invite!.role.toLowerCase()}</b>,
              for <b>{invite!.email}</b>.
            </p>

            {!session?.user ? (
              <>
                <p className="rd-auth-sub">Sign in or create your account with that email to accept.</p>
                <Link
                  href={`/auth/signup?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
                  className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit"
                >
                  Create account
                </Link>
                <p className="rd-auth-footer">
                  Already have an account?{" "}
                  <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`} className="rd-auth-link">
                    Sign in
                  </Link>
                </p>
              </>
            ) : emailMatches ? (
              <AcceptInvite token={token} />
            ) : (
              <p className="rd-auth-error">
                This invitation is for {invite!.email}, but you&apos;re signed in as {session.user.email}. Sign in
                with the invited email to accept.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
