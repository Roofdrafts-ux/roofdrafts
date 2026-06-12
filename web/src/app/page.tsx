import { App } from "@/components/App";
import { SITE } from "@/lib/site";

// Structured data for rich search results (Organization + the report service).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/icon.svg`,
      description: SITE.description,
      sameAs: [`https://twitter.com/${SITE.twitter.replace(/^@/, "")}`],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: "+1-682-325-7399",
        email: "support@roofdrafts.com",
        areaServed: "US",
      },
    },
    {
      "@type": "Service",
      "@id": `${SITE.url}/#service`,
      name: "Aerial roof-measurement report",
      provider: { "@id": `${SITE.url}/#organization` },
      areaServed: { "@type": "Country", name: "United States" },
      serviceType: "Roof measurement and estimating report",
      description:
        "Human-verified aerial roof reports — area, squares, pitch and line lengths delivered as PDF, Xactimate ESX and XML within a 6–10 hour SLA.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      publisher: { "@id": `${SITE.url}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, trusted content — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <App />
    </>
  );
}
