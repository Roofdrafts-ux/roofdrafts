"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoofMark } from "@/components/primitives";

type AccountType = "individual" | "company";
const VOLUMES: { value: string; label: string }[] = [
  { value: "1-5", label: "1–5 reports / month" },
  { value: "5-20", label: "5–20 reports / month" },
  { value: "20+", label: "20+ reports / month" },
];
export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [companyName, setCompanyName] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("1-5");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingLead, setBookingLead] = useState(false);
  const [bookingUrl, setBookingUrl] = useState("");

  const isCompany = accountType === "company";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) { setError("Please accept the terms to continue."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        accountType,
        companyName: isCompany ? companyName : undefined,
        monthlyVolume: isCompany ? monthlyVolume : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const data = await res.json().catch(() => ({} as { bookingUrl?: string }));

    // Sign in (no auto-redirect) so we can route company leads to a booking step.
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) {
      // Account created but auto sign-in failed — send them to sign in explicitly.
      router.push("/auth/signin");
      return;
    }

    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/go";

    if (isCompany) {
      setBookingUrl(data.bookingUrl ?? "");
      setBookingLead(true);
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleGoogle() {
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/go";
    await signIn("google", { callbackUrl });
  }

  // ── Post-signup booking step for company leads ──
  if (bookingLead) {
    return (
      <div className="rd-auth-shell">
        <div className="rd-auth-card">
          <div className="rd-auth-brand">
            <RoofMark size={30} />
            <span className="rd-auth-brand-roof">roof</span>
            <span className="rd-auth-brand-drafts">drafts</span>
          </div>
          <h1 className="rd-auth-heading">You&apos;re all set{name ? `, ${name.split(" ")[0]}` : ""} 👋</h1>
          <p className="rd-auth-sub">
            {monthlyVolume === "1-5"
              ? "Your account is ready — order your first report anytime."
              : "For your volume, we offer dedicated estimators, consolidated billing and volume pricing. Let's get you set up."}
          </p>

          {monthlyVolume !== "1-5" && (
            bookingUrl ? (
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
                 className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit">
                Book a 15-min onboarding call
              </a>
            ) : (
              <p className="rd-auth-sub" style={{ marginTop: 8 }}>
                Our team will reach out shortly to set up your account.
              </p>
            )
          )}

          <button
            type="button"
            className="nj2-btn nj2-btn-lg rd-auth-submit"
            style={{ marginTop: 10, background: "transparent", color: "var(--tp-accent, #BE5630)", border: "1px solid var(--tp-accent, #BE5630)" }}
            onClick={() => router.push("/dashboard")}
          >
            Continue to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rd-auth-shell">
      <div className="rd-auth-card">
        <div className="rd-auth-brand">
          <RoofMark size={30} />
          <span className="rd-auth-brand-roof">roof</span>
          <span className="rd-auth-brand-drafts">drafts</span>
        </div>

        <h1 className="rd-auth-heading">Create account</h1>
        <p className="rd-auth-sub">Get your first report in under 10 hours.</p>

        <button
          type="button"
          className="rd-auth-google-btn"
          onClick={handleGoogle}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="rd-auth-divider"><span>or</span></div>

        <form onSubmit={handleSubmit} className="rd-auth-form">
          {/* Account type — segmentation (display/routing only) */}
          <div className="rd-field">
            <span className="rd-field-label">I&apos;m signing up as</span>
            <div role="group" aria-label="Account type" style={{ display: "flex", gap: 8 }}>
              {(["individual", "company"] as AccountType[]).map((t) => {
                const active = accountType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAccountType(t)}
                    aria-pressed={active}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                      border: active ? "1.5px solid var(--tp-accent, #BE5630)" : "1px solid #d8d2c7",
                      background: active ? "var(--tp-accent-soft, #FBECE4)" : "#fff",
                      color: active ? "var(--tp-accent-600, #A2451F)" : "#5a544a",
                    }}
                  >
                    {t === "individual" ? "Individual" : "Company"}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="rd-field">
            <span className="rd-field-label">Name</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rd-input"
              placeholder="Your name"
            />
          </label>

          {isCompany && (
            <>
              <label className="rd-field">
                <span className="rd-field-label">Company name</span>
                <input
                  type="text"
                  required
                  autoComplete="organization"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="rd-input"
                  placeholder="Acme Roofing"
                />
              </label>

              <label className="rd-field">
                <span className="rd-field-label">Reports per month</span>
                <select
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(e.target.value)}
                  className="rd-input"
                >
                  {VOLUMES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="rd-field">
            <span className="rd-field-label">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rd-input"
              placeholder="you@example.com"
            />
          </label>

          <label className="rd-field">
            <span className="rd-field-label">Password</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rd-input"
              placeholder="At least 8 characters"
            />
          </label>

          {/* Consent capture — required for ConsentRecord */}
          <label className="rd-consent-row">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="rd-consent-check"
            />
            <span className="rd-consent-text">
              I agree to the{" "}
              <Link href="/legal/terms" className="rd-auth-link">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/legal/privacy" className="rd-auth-link">Privacy Policy</Link>
            </span>
          </label>

          {error && <p className="rd-auth-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="nj2-btn nj2-btn-brand nj2-btn-lg rd-auth-submit"
            disabled={loading || !agree}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="rd-auth-footer">
          Already have an account?{" "}
          <Link href="/auth/signin" className="rd-auth-link">Sign in</Link>
        </p>
        <p className="rd-auth-trust">±2% accuracy · 50-state coverage · Xactimate-ready</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
