"use client";
// ════════════════════════════════════════════════════════════════
// Roofdrafts — sections part 1: Nav, Hero, ReportFrame, TrustBar,
//             HowItWorks, Formats
// ════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from "react";
import { Icon, Wordmark, Eyebrow, Reveal } from "./primitives";
import { RoofPlanHero, RoofPlanCompact } from "./RoofPlan";
import { computeRoof, commas, MODEL_CROSS_GABLE } from "@/lib/roofcalc";

/* ───────── NAV ───────── */
export function Nav({ onOrder }: { onOrder: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  const links: [string, string][] = [
    ["How it works", "#how"],
    ["Reports", "#formats"],
    ["Turnaround", "#sla"],
    ["Coverage", "#coverage"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
  ];
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
          maxWidth: "var(--tp-maxw)",
          margin: "0 auto",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Wordmark size={42} />
        <nav style={{ display: "flex", gap: 2, marginLeft: 8 }} className="tp-nav-desktop">
          {links.map(([l, h]) => (
            <a key={l} href={h} className="tp-navlink">
              {l}
            </a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <a
          href="tel:+16823257399"
          className="tp-navlink tp-nav-desktop"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="phone" size={13} style={{ opacity: 0.6 }} /> (682) 325-7399
        </a>
        <button className="nj2-btn tp-btn-accent nj2-btn-sm" onClick={onOrder}>
          Order a report <span style={{ opacity: 0.8 }}>→</span>
        </button>
      </div>
    </header>
  );
}

/* ───────── REPORT FRAME — hero centerpiece ───────── */
export function ReportFrame() {
  const m = computeRoof(MODEL_CROSS_GABLE);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--nj2-r-2xl)",
        border: "1px solid var(--nj2-border)",
        background: "var(--nj2-bg-card)",
        overflow: "hidden",
        boxShadow:
          "0 40px 80px -30px rgba(15,15,17,.22), 0 16px 40px -22px rgba(15,15,17,.12)",
      }}
    >
      {/* chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 14px",
          borderBottom: "1px solid var(--nj2-border-subtle)",
          background: "var(--nj2-bg-sunken)",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ width: 10, height: 10, borderRadius: 999, background: "var(--nj2-ink-200)" }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--nj2-font-mono)",
            fontSize: 11,
            color: "var(--nj2-fg-3)",
          }}
        >
          app.roofdrafts.com <span style={{ color: "var(--nj2-fg-4)" }}>/</span> reports{" "}
          <span style={{ color: "var(--nj2-fg-4)" }}>/</span>{" "}
          <span style={{ color: "var(--nj2-fg-2)" }}>RD-48213</span>
        </div>
        <span className="tp-dot" style={{ color: "var(--tp-verify)", background: "var(--tp-verify)" }} />
      </div>
      <div
        className="tp-report-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 264px", minHeight: 440 }}
      >
        {/* diagram pane — blueprint */}
        <div
          className="tp-blueprint tp-reg"
          style={{
            padding: "20px 24px",
            position: "relative",
            borderRight: "1px solid var(--nj2-border-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--nj2-font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--tp-blueprint-key)",
                }}
              >
                Roof plan · top-down
              </div>
              <div
                style={{
                  fontFamily: "var(--nj2-font-mono)",
                  fontSize: 11,
                  color: "rgba(191,228,239,.6)",
                  marginTop: 3,
                }}
              >
                1412 Magnolia Ave · Fort Worth, TX
              </div>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 9px",
                fontSize: 11,
                fontFamily: "var(--nj2-font-mono)",
                borderRadius: "var(--nj2-r-sm)",
                border: "1px solid rgba(191,228,239,.22)",
                background: "rgba(191,228,239,.06)",
                color: "var(--tp-blueprint-line)",
              }}
            >
              <Icon name="ruler" size={12} /> 1:120
            </span>
          </div>
          <div style={{ maxWidth: 460, margin: "0 auto" }}>
            <RoofPlanHero animate={true} />
          </div>
        </div>
        {/* measurements panel */}
        <div
          style={{
            padding: 16,
            background: "linear-gradient(180deg, var(--nj2-bg-card) 0%, var(--nj2-bg-sunken) 100%)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            className="tp-card"
            style={{
              padding: 13,
              borderColor: "color-mix(in srgb, var(--tp-verify) 28%, transparent)",
              boxShadow: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--nj2-lime)",
                  boxShadow: "0 0 8px var(--nj2-lime)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--nj2-font-mono)",
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--nj2-success)",
                  whiteSpace: "nowrap",
                }}
              >
                QA verified
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Checked by a human estimator</div>
            <div
              style={{
                fontFamily: "var(--nj2-font-mono)",
                fontSize: 10.5,
                color: "var(--nj2-fg-3)",
                marginTop: 7,
                lineHeight: 1.8,
              }}
            >
              <div>
                <span style={{ color: "var(--nj2-fg-4)" }}>id&nbsp;&nbsp;&nbsp;</span>RD-48213
              </div>
              <div>
                <span style={{ color: "var(--nj2-fg-4)" }}>±&nbsp;&nbsp;&nbsp;&nbsp;</span>2% area
                tolerance
              </div>
              <div>
                <span style={{ color: "var(--nj2-fg-4)" }}>ready</span> 6h 12m
              </div>
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--nj2-font-mono)",
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--nj2-fg-3)",
                marginBottom: 8,
              }}
            >
              Measurements
            </div>
            <div style={{ fontFamily: "var(--nj2-font-mono)", fontSize: 11.5 }}>
              <FRow k="Total area" v={`${commas(Math.round(m.totalArea))} ft²`} />
              <FRow k="Roof squares" v={`${m.squares.toFixed(1)} SQ`} />
              <FRow k="Predominant pitch" v={m.predominantPitch} />
              <FRow k="Ridges" v={`${Math.round(m.byType.ridge)} ft`} />
              <FRow k="Valleys" v={`${Math.round(m.byType.valley)} ft`} />
              <FRow k="Rakes" v={`${Math.round(m.byType.rake)} ft`} />
              <FRow k="Eaves" v={`${Math.round(m.byType.eave)} ft`} />
              <FRow k="Facets" v={String(m.facetCount)} />
            </div>
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 6 }}>
            {["PDF", "ESX", "XML"].map((f) => (
              <span
                key={f}
                className="tp-pill"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  padding: "6px 0",
                  fontSize: 11,
                  fontFamily: "var(--nj2-font-mono)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function FRow({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        borderBottom: "1px solid var(--nj2-border-subtle)",
        minHeight: 26,
        lineHeight: 1.4,
      }}
    >
      <span style={{ color: "var(--nj2-fg-3)", whiteSpace: "nowrap" }}>{k}</span>
      <span style={{ color: "var(--nj2-fg-1)", fontWeight: 600, whiteSpace: "nowrap" }}>{v}</span>
    </div>
  );
}

/* ───────── HERO ───────── */
export function Hero({
  onOrder,
  headline,
  variant,
}: {
  onOrder: () => void;
  headline: string;
  variant: string;
}) {
  return (
    <section id="top" style={{ position: "relative", overflow: "hidden" }}>
      <div
        className="tp-dotgrid"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          maskImage: "radial-gradient(ellipse 75% 55% at 50% 8%, black 25%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 55% at 50% 8%, black 25%, transparent 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 42% at 50% -4%, var(--tp-accent-soft), transparent 60%)",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 1040,
          margin: "0 auto",
          padding: "64px 28px 40px",
          textAlign: "center",
        }}
      >
        <a className="tp-pill" href="#sla" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
          <span className="tp-dot" style={{ color: "var(--nj2-success)", background: "var(--nj2-success)" }} />
          <span style={{ fontFamily: "var(--nj2-font-mono)", fontSize: 11, color: "var(--nj2-fg-2)" }}>
            6–10 hr turnaround
          </span>
          <span style={{ width: 1, height: 11, background: "var(--nj2-border)" }} />
          <span style={{ color: "var(--nj2-fg-2)" }}>same-day before 4pm CT</span>
          <span style={{ color: "var(--nj2-fg-3)" }}>→</span>
        </a>
        <h1
          style={{
            fontFamily: "var(--nj2-font-display)",
            fontWeight: 600,
            fontSize: "clamp(40px, 6vw, 74px)",
            letterSpacing: "-.04em",
            lineHeight: 1.02,
            margin: "26px auto 0",
            maxWidth: 900,
            textWrap: "balance",
          }}
        >
          {variant === "speed" ? (
            <>
              Roof reports that <span style={{ color: "var(--tp-accent)" }}>beat the adjuster</span> to
              the property.
            </>
          ) : variant === "trust" ? (
            <>
              The measurements your <span style={{ color: "var(--tp-accent)" }}>estimate</span> can
              stand behind.
            </>
          ) : (
            <>
              {headline || "Accurate roof diagrams,"}
              <br />
              <span style={{ color: "var(--tp-accent)" }}>delivered before lunch.</span>
            </>
          )}
        </h1>
        <p className="tp-lede" style={{ maxWidth: 620, margin: "24px auto 0", fontSize: 18 }}>
          Roofdrafts turns aerial imagery into precise, estimate-ready roof reports — area, squares,
          pitch, ridges, hips and valleys — every one checked by a human estimator before it lands in
          your inbox.
        </p>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button className="nj2-btn tp-btn-accent nj2-btn-lg" onClick={onOrder}>
            Order a report <span style={{ opacity: 0.8 }}>→</span>
          </button>
          <a className="nj2-btn nj2-btn-secondary nj2-btn-lg" href="#sample">
            <Icon name="file-text" size={15} style={{ color: "var(--tp-blue)" }} /> See a sample
            report
          </a>
        </div>
        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            fontFamily: "var(--nj2-font-mono)",
            fontSize: 11,
            color: "var(--nj2-fg-3)",
            letterSpacing: ".02em",
          }}
        >
          <span>Xactimate-ready ESX</span>
          <span style={{ color: "var(--nj2-fg-4)" }}>/</span>
          <span>±2% area tolerance</span>
          <span style={{ color: "var(--nj2-fg-4)" }}>/</span>
          <span>50-state coverage</span>
          <span style={{ color: "var(--nj2-fg-4)" }}>/</span>
          <span>flat-rate pricing</span>
        </div>
      </div>
      <div
        id="sample"
        style={{
          position: "relative",
          maxWidth: "var(--tp-maxw)",
          margin: "0 auto 76px",
          padding: "0 28px",
          scrollMarginTop: 80,
        }}
      >
        <ReportFrame />
      </div>
    </section>
  );
}

/* ───────── TRUST BAR ───────── */
export function TrustBar() {
  const stats: [string, string][] = [
    ["41,000+", "reports delivered"],
    ["6.4 hr", "median turnaround"],
    ["±2%", "area tolerance, guaranteed"],
    ["98.7%", "pass adjuster review"],
  ];
  return (
    <section
      style={{
        borderTop: "1px solid var(--nj2-border-subtle)",
        borderBottom: "1px solid var(--nj2-border-subtle)",
        background: "var(--nj2-bg-card)",
      }}
    >
      <div style={{ maxWidth: "var(--tp-maxw)", margin: "0 auto", padding: "8px 28px" }}>
        <div
          style={{
            fontFamily: "var(--nj2-font-mono)",
            fontSize: 10.5,
            fontWeight: 500,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "var(--nj2-fg-3)",
            textAlign: "center",
            padding: "20px 0 4px",
          }}
        >
          The estimating backbone for roofers, restoration firms &amp; independent adjusters
        </div>
        <div className="tp-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {stats.map(([v, l], i) => (
            <div
              key={l}
              style={{
                padding: "22px 16px",
                textAlign: "center",
                borderRight: i < 3 ? "1px solid var(--nj2-border-subtle)" : "none",
              }}
            >
              <div
                className="tp-num"
                style={{
                  fontFamily: "var(--nj2-font-display)",
                  fontWeight: 600,
                  fontSize: "clamp(26px,3vw,36px)",
                  letterSpacing: "-.03em",
                }}
              >
                {v}
              </div>
              <div style={{ fontFamily: "var(--nj2-font-mono)", fontSize: 11, color: "var(--nj2-fg-3)", marginTop: 4 }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── HOW IT WORKS ───────── */
export function HowItWorks({ onOrder }: { onOrder: () => void }) {
  const steps = [
    {
      n: "01",
      k: "Order",
      icon: "map-pin",
      t: "Drop a pin or paste an address.",
      sub: "No site visit, no ladder, no drone. Enter the property address and pick the report type — residential, commercial, or 3D wall.",
    },
    {
      n: "02",
      k: "Draft",
      icon: "scan-line",
      t: "We model the roof from aerial imagery.",
      sub: "High-resolution multi-source imagery is traced into a true-to-scale 3D model, then flattened into a measured plan.",
    },
    {
      n: "03",
      k: "Verify",
      icon: "shield-check",
      t: "A human estimator checks every facet.",
      sub: "No raw AI output ships. An estimator confirms pitch, area and line counts against a ±2% tolerance before release.",
    },
    {
      n: "04",
      k: "Deliver",
      icon: "download",
      t: "PDF, ESX and XML in your inbox.",
      sub: "Drop the ESX straight into Xactimate. Median delivery 6.4 hours — same-day on orders placed before 4pm CT.",
    },
  ];
  return (
    <section id="how" style={{ padding: "92px 28px", scrollMarginTop: 70 }}>
      <div style={{ maxWidth: "var(--tp-maxw)", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="tp-h2">From address to estimate-ready, while you finish your coffee.</h2>
          </div>
          <button className="nj2-btn nj2-btn-secondary" onClick={onOrder}>
            Start an order <span style={{ opacity: 0.6 }}>→</span>
          </button>
        </div>
        <div
          className="tp-how-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 46 }}
        >
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="tp-card" style={{ padding: 22, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "var(--nj2-font-mono)",
                      fontSize: 11,
                      color: "var(--nj2-fg-3)",
                      letterSpacing: ".08em",
                    }}
                  >
                    {s.n}
                  </span>
                  <span style={{ height: 1, flex: 1, background: "var(--nj2-border)" }} />
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "var(--tp-accent-soft)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--tp-accent)",
                    }}
                  >
                    <Icon name={s.icon} size={16} />
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--nj2-font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "var(--tp-accent)",
                    marginTop: 18,
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    fontFamily: "var(--nj2-font-display)",
                    fontWeight: 600,
                    fontSize: 18,
                    letterSpacing: "-.02em",
                    lineHeight: 1.25,
                    margin: "8px 0 8px",
                    textWrap: "balance",
                  }}
                >
                  {s.t}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--nj2-fg-2)" }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── FORMATS ───────── */
export function Formats() {
  const reports = [
    {
      tag: "Residential",
      icon: "house",
      pitch: "6/12",
      t: "Residential roof report",
      desc: "Single-family and multi-family homes. Area, squares, pitch, and every ridge, hip and valley — with waste tables.",
      items: ["Pitch & squares", "Waste calc 0–22%", "Material order ready"],
    },
    {
      tag: "Commercial",
      icon: "building-2",
      pitch: "Low-slope",
      t: "Commercial roof report",
      desc: "Warehouses, retail, flat and low-slope. Parapets, drains, penetrations and accurate perimeter linework.",
      items: ["Perimeter & area", "Penetration counts", "Up to 50 buildings"],
    },
    {
      tag: "3D / ESX",
      icon: "box",
      pitch: "Wall ESX",
      t: "3D ESX wall diagram",
      desc: "Full 3D model with wall elevations exported as an Xactimate-ready ESX — siding, gutters and more, in one sketch.",
      items: ["Walls + roof", "Native .ESX", "Drag into Xactimate"],
    },
  ];
  return (
    <section
      id="formats"
      style={{
        padding: "92px 28px",
        background: "var(--nj2-bg-card)",
        borderTop: "1px solid var(--nj2-border-subtle)",
        borderBottom: "1px solid var(--nj2-border-subtle)",
        scrollMarginTop: 70,
      }}
    >
      <div style={{ maxWidth: "var(--tp-maxw)", margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
          <Eyebrow style={{ justifyContent: "center" }}>Reports &amp; formats</Eyebrow>
          <h2 className="tp-h2">One sketch. Every file your workflow needs.</h2>
          <p className="tp-lede" style={{ margin: "16px auto 0", maxWidth: 560 }}>
            Pick the report; we deliver it as a signed PDF, a native Xactimate ESX, and raw XML — so
            it drops straight into your estimate.
          </p>
        </div>
        <div
          className="tp-fmt-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 48 }}
        >
          {reports.map((r, i) => (
            <Reveal key={r.tag} delay={i * 90}>
              <div
                className="tp-card"
                style={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}
              >
                <div
                  className="tp-graph-fine"
                  style={{ padding: "14px 16px 4px", borderBottom: "1px solid var(--nj2-border-subtle)" }}
                >
                  <div style={{ maxWidth: 230, margin: "0 auto" }}>
                    <RoofPlanCompact pitch={r.pitch} />
                  </div>
                </div>
                <div style={{ padding: 22, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        background: "var(--tp-blue-soft)",
                        display: "grid",
                        placeItems: "center",
                        color: "var(--tp-blue)",
                      }}
                    >
                      <Icon name={r.icon} size={15} />
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--nj2-font-mono)",
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--tp-blue)",
                      }}
                    >
                      {r.tag}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--nj2-font-display)",
                      fontWeight: 600,
                      fontSize: 19,
                      letterSpacing: "-.02em",
                      margin: "14px 0 8px",
                    }}
                  >
                    {r.t}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--nj2-fg-2)" }}>{r.desc}</div>
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: "1px dashed var(--nj2-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                    }}
                  >
                    {r.items.map((it) => (
                      <div
                        key={it}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--nj2-fg-2)" }}
                      >
                        <Icon name="check" size={13} style={{ color: "var(--nj2-success)" }} /> {it}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        {/* every report includes */}
        <div style={{ marginTop: 28 }}>
          <div className="tp-ledger" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 22,
            }}
          >
            <span
              style={{
                fontFamily: "var(--nj2-font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--nj2-fg-3)",
                marginRight: 4,
              }}
            >
              Every report includes
            </span>
            {(
              [
                ["file-text", "PDF · ESX · XML"],
                ["box", "Your logo & branding"],
                ["layers", "Material order export"],
                ["scan-line", "Property photos"],
                ["target", "±2% accuracy guarantee"],
              ] as [string, string][]
            ).map(([ic, label]) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 13px",
                  borderRadius: "var(--nj2-r-pill)",
                  border: "1px solid var(--nj2-border)",
                  background: "var(--nj2-bg-card)",
                  fontSize: 12.5,
                  color: "var(--nj2-fg-1)",
                }}
              >
                <Icon name={ic} size={13} style={{ color: "var(--tp-accent)" }} /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
