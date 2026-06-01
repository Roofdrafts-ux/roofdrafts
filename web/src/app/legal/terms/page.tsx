import Link from "next/link";
import "../legal.css";

export const metadata = { title: "Terms of Service (Draft) — Roofdrafts" };

export default function TermsPage() {
  return (
    <div className="rd-legal">
      <div className="rd-legal-banner">DRAFT — pending legal review. Not a binding agreement.</div>
      <main className="rd-legal-main">
        <Link href="/" className="rd-legal-brand">
          <span className="rd-legal-brand-roof">roof</span>
          <span className="rd-legal-brand-drafts">drafts</span>
        </Link>
        <h1>Terms of Service</h1>
        <p className="rd-legal-updated">Draft · placeholder content pending counsel review</p>

        <h2>1. Service</h2>
        <p>
          Roofdrafts produces aerial roof-measurement reports for a property address and
          delivers them as PDF, Xactimate ESX, and XML files. Reports are human-verified to a
          stated accuracy tolerance.
        </p>
        <h2>2. Orders &amp; payment</h2>
        <p>
          You authorize the charge shown at checkout for each report ordered. Pricing is
          presented before payment. Volume and invoiced accounts may be offered separately.
        </p>
        <h2>3. Accuracy &amp; revisions</h2>
        <p>
          Reports carry a per-report accuracy contract. If a delivered report falls outside
          tolerance, request a revision and we will re-verify the measurement.
        </p>
        <h2>4. Acceptable use</h2>
        <p>
          You may use delivered reports for estimating and insurance documentation. You may not
          resell raw imagery sourced under our provider licenses.
        </p>
        <p>
          <em>
            This is placeholder text. Final terms will be drafted and reviewed by legal counsel
            before launch.
          </em>
        </p>
      </main>
    </div>
  );
}
