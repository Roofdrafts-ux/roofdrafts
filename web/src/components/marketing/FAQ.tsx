"use client";
// FAQ — client because of the accordion open-state.
import React, { useState } from "react";
import { Icon, Eyebrow } from "../primitives";

const ITEMS: [string, string][] = [
  [
    "How accurate are the measurements?",
    "Every report is guaranteed within ±2% of true roof area. We model from high-resolution aerial imagery, then a human estimator verifies pitch, facet count and linework before release. If an adjuster disputes the area, we re-measure free.",
  ],
  [
    "Do I get a native Xactimate file?",
    "Yes. Every order ships as a signed PDF, a native .ESX, and raw XML. The ESX drops straight into Xactimate with pitch, squares and waste already populated — no re-tracing.",
  ],
  [
    "How fast is delivery, really?",
    "Median turnaround is 6.4 hours; standard SLA is 6–10 hours. Orders placed before 4pm CT are delivered same day. Rush (3 hr) and overnight bulk options are available at checkout.",
  ],
  [
    "What if the imagery is out of date or obstructed?",
    "We pull from multiple imagery sources and pick the clearest, most recent capture. If no source meets our standard, we tell you before charging — you’re never billed for a report we can’t stand behind.",
  ],
  [
    "Can you handle storm-route volume?",
    "That’s our busiest lane. Batch 10+ properties for overnight delivery by 7am local, with a dedicated estimator and consolidated billing. Volume pricing is quoted same day.",
  ],
  [
    "Do you cover commercial and low-slope roofs?",
    "Yes — warehouses, retail, multi-building campuses and flat roofs, with parapets, drains and penetration counts. Up to 50 buildings on a single order.",
  ],
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" style={{ padding: "92px 28px", scrollMarginTop: 70 }}>
      <div
        className="tp-faq-wrap"
        style={{
          maxWidth: "var(--tp-maxw)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "0.8fr 1.2fr",
          gap: 56,
        }}
      >
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="tp-h2">
            Questions, before
            <br />
            you order.
          </h2>
          <p className="tp-lede" style={{ marginTop: 16 }}>
            Still unsure? Talk to a real estimator — no bots, no queue.
          </p>
          <a className="nj2-btn nj2-btn-secondary" href="tel:+16823257399" style={{ marginTop: 20 }}>
            <Icon name="phone" size={14} /> +1 (682) 325-7399
          </a>
        </div>
        <div>
          {ITEMS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                style={{
                  borderTop: "1px solid var(--nj2-border)",
                  borderBottom: i === ITEMS.length - 1 ? "1px solid var(--nj2-border)" : "none",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "18px 4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--nj2-fg-1)",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontFamily: "var(--nj2-font-display)",
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: "-.015em",
                    }}
                  >
                    {q}
                  </span>
                  <Icon name={isOpen ? "minus" : "plus"} size={17} style={{ color: "var(--tp-accent)" }} />
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 260 : 0,
                    overflow: "hidden",
                    transition: "max-height .35s var(--nj2-ease)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      padding: "0 32px 20px 4px",
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--nj2-fg-2)",
                      textWrap: "pretty",
                    }}
                  >
                    {a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
