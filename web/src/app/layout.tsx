import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roofdrafts — Accurate roof diagrams, delivered fast",
  description:
    "Order an aerial roof-measurement report by address. Human-verified pitch, area, squares and line lengths delivered as PDF, Xactimate ESX and XML within a 6–10 hr SLA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
