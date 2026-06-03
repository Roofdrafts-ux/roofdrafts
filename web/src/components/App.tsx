"use client";
// ════════════════════════════════════════════════════════════════
// Roofdrafts — marketing app shell
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { Icon } from "./primitives";
import { Nav, Hero, TrustBar, HowItWorks, Formats } from "./Marketing";
import { SLA, Coverage, Testimonials, Pricing, FAQ, CTAFooter } from "./Marketing2";
import { OrderFlow } from "./OrderFlow";

export function App() {
  const [orderOpen, setOrderOpen] = useState(false);

  // pin brand accent (Clay) + light theme
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--tp-accent", "#BE5630");
    r.style.setProperty("--tp-accent-600", "#A2451F");
    r.style.setProperty("--tp-accent-soft", "#FBECE4");
    r.style.setProperty("--tp-accent-ring", "rgba(190,86,48,.30)");
    r.setAttribute("data-theme", "light");
  }, []);

  // Deep-link: /?order=1 (e.g. the dashboard "Order a report" button) opens the modal directly.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("order") === "1") setOrderOpen(true);
  }, []);

  const openOrder = () => setOrderOpen(true);

  return (
    <div>
      <Nav onOrder={openOrder} />
      <Hero onOrder={openOrder} headline="Accurate roof diagrams," variant="default" />
      <TrustBar />
      <HowItWorks onOrder={openOrder} />
      <Formats />
      <SLA onOrder={openOrder} />
      <Coverage />
      <Testimonials />
      <Pricing onOrder={openOrder} />
      <FAQ />
      <CTAFooter onOrder={openOrder} />

      <OrderFlow open={orderOpen} onClose={() => setOrderOpen(false)} />

      {/* floating order button */}
      <button
        onClick={openOrder}
        aria-label="Order a report"
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 80,
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          padding: "13px 20px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          color: "#fff",
          background: "var(--tp-accent)",
          fontFamily: "var(--nj2-font-body)",
          fontWeight: 600,
          fontSize: 14.5,
          whiteSpace: "nowrap",
          boxShadow:
            "0 10px 30px -8px var(--tp-accent-ring), 0 4px 10px rgba(0,0,0,.12)",
          transition: "transform .15s var(--nj2-ease-io)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
      >
        <Icon name="ruler" size={17} /> Order a report
      </button>
    </div>
  );
}
