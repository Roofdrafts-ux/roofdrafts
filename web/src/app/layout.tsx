import type { Metadata } from "next";
import { Space_Grotesk, Hanken_Grotesk, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SITE } from "@/lib/site";

// Self-hosted, preloaded, zero-CLS — replaces the render-blocking @import.
// Variable fonts: full weight axis, no per-weight requests. CSS var names
// match the existing --nj2-font-* tokens so no stylesheet changes are needed.
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const logo = Inter({ subsets: ["latin"], variable: "--font-logo", display: "swap" });
const fontVars = `${display.variable} ${body.variable} ${mono.variable} ${logo.variable}`;

const TITLE = "Roofdrafts — Accurate roof diagrams, delivered fast";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE,
    template: "%s · Roofdrafts",
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    title: TITLE,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    title: TITLE,
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
