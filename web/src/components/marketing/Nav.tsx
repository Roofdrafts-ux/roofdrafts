"use client";
// Marketing nav — client because it reacts to scroll. Order CTA uses the
// shared OrderButton (context-wired).
import React, { useEffect, useState } from "react";
import { Icon, Wordmark } from "../primitives";
import { OrderButton } from "./OrderModalProvider";

const LINKS: [string, string][] = [
  ["How it works", "#how"],
  ["Reports", "#formats"],
  ["Turnaround", "#sla"],
  ["Coverage", "#coverage"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: scrolled
          ? "color-mix(in srgb, var(--nj2-bg-card) 82%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px) saturate(1.4)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--nj2-border-subtle)" : "transparent"}`,
        transition: "background .25s, border-color .25s",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Wordmark size={42} />
        <nav style={{ display: "flex", gap: 2, marginLeft: 8 }} className="tp-nav-desktop">
          {LINKS.map(([l, h]) => (
            <a key={l} href={h} className="tp-navlink">
              {l}
            </a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <a
          href="tel:+16823257399"
          className="tp-navlink tp-nav-phone"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="phone" size={13} style={{ opacity: 0.6 }} /> (682) 325-7399
        </a>
        <a href="/auth/signin" className="tp-navlink tp-nav-auth">Sign in</a>
        <a href="/auth/signup" className="nj2-btn nj2-btn-sm tp-nav-auth" style={{ background: "transparent", border: "1px solid var(--nj2-border-subtle, #d8d2c7)" }}>
          Sign up
        </a>
        <OrderButton className="nj2-btn tp-btn-accent nj2-btn-sm">
          Order a report <span style={{ opacity: 0.8 }}>→</span>
        </OrderButton>
      </div>
    </header>
  );
}
