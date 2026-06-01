import Link from "next/link";
import "../legal.css";

export const metadata = { title: "Privacy Policy (Draft) — Roofdrafts" };

export default function PrivacyPage() {
  return (
    <div className="rd-legal">
      <div className="rd-legal-banner">DRAFT — pending legal review. Not a binding agreement.</div>
      <main className="rd-legal-main">
        <Link href="/" className="rd-legal-brand">
          <span className="rd-legal-brand-roof">roof</span>
          <span className="rd-legal-brand-drafts">drafts</span>
        </Link>
        <h1>Privacy Policy</h1>
        <p className="rd-legal-updated">Draft · placeholder content pending counsel review</p>

        <h2>1. What we collect</h2>
        <p>
          Account details (name, email), order details (property address, notes), payment status
          (processed by Stripe — we do not store card numbers), and consent records (timestamp,
          IP, user agent) for terms acceptance and payment authorization.
        </p>
        <h2>2. How we use it</h2>
        <p>
          To produce and deliver your reports, process payments, send transactional email about
          your orders, and meet legal and accounting obligations.
        </p>
        <h2>3. Sharing</h2>
        <p>
          We share data only with processors needed to run the service (hosting, payments, email,
          imagery providers). We do not sell personal information.
        </p>
        <h2>4. Your choices</h2>
        <p>
          You may request access to or deletion of your account data, subject to records we must
          retain for legal and financial compliance.
        </p>
        <p>
          <em>
            This is placeholder text. The final privacy policy will be drafted and reviewed by
            legal counsel before launch.
          </em>
        </p>
      </main>
    </div>
  );
}
