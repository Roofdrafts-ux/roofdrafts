"use client";
// ════════════════════════════════════════════════════════════════
// Roofdrafts — interactive order-flow modal
// Steps: Address → Report → Details → Review → (modeling) → Confirmed
// ════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { Icon, RoofMark } from "./primitives";
import { RoofPlanCompact } from "./RoofPlan";

type OrderData = {
  address: string;
  city: string;
  unit: string;
  rtype: string;
  turnaround: string;
  notes: string;
  name: string;
  company: string;
  email: string;
  phone: string;
};

type TypeMeta = { label: string; icon: string; sub: string };
type TurnMeta = { label: string; time: string; icon: string; sub: string };

export function OrderFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const STEPS = ["Address", "Report", "Details", "Review"];
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"form" | "modeling" | "done" | "error">("form");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<OrderData>({
    address: "",
    city: "",
    unit: "",
    rtype: "residential",
    turnaround: "standard",
    notes: "",
    name: "",
    company: "",
    email: "",
    phone: "",
  });
  const [touched, setTouched] = useState(false);
  const reportId = useRef("RD-" + Math.floor(48000 + Math.random() * 1900));
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, cardRef);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "form") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  if (!open) return null;

  const set = (k: keyof OrderData, v: string) => setData((d) => ({ ...d, [k]: v }));
  const reset = () => {
    setStep(0);
    setPhase("form");
    setTouched(false);
    reportId.current = "RD-" + Math.floor(48000 + Math.random() * 1900);
    setData({
      address: "",
      city: "",
      unit: "",
      rtype: "residential",
      turnaround: "standard",
      notes: "",
      name: "",
      company: "",
      email: "",
      phone: "",
    });
  };
  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const RTYPES: Record<string, TypeMeta> = {
    residential: { label: "Residential", icon: "house", sub: "Single & multi-family" },
    commercial: { label: "Commercial", icon: "building-2", sub: "Flat / low-slope" },
    threeD: { label: "3D / ESX wall", icon: "box", sub: "Walls + roof model" },
  };
  const TURN: Record<string, TurnMeta> = {
    standard: { label: "Standard", time: "6–10 hr", icon: "clock", sub: "Same-day before 4pm CT" },
    rush: { label: "Rush", time: "3 hr", icon: "zap", sub: "Priority queue" },
    bulk: { label: "Bulk / overnight", time: "By 7am", icon: "layers", sub: "10+ properties" },
  };

  const validStep = () => {
    if (step === 0) return data.address.trim().length > 4 && data.city.trim().length > 1;
    if (step === 2) return /\S+@\S+\.\S+/.test(data.email) && data.name.trim().length > 1;
    return true;
  };

  const next = () => {
    setTouched(true);
    if (!validStep()) return;
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      setTouched(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else {
      submit();
    }
  };
  const back = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setTouched(false);
    }
  };

  const submit = async () => {
    setPhase("modeling");
    setSubmitError(null);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: data.address,
          city: data.city,
          unit: data.unit,
          rtype: data.rtype,
          turnaround: data.turnaround,
          notes: data.notes,
        }),
      });

      // Not signed in → send to sign-in, returning to the dashboard afterward.
      if (res.status === 401) {
        window.location.href =
          "/auth/signin?callbackUrl=" + encodeURIComponent("/dashboard");
        return;
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSubmitError(
          (d as { error?: string }).error ??
            "We couldn't place your order. Please try again."
        );
        setPhase("error");
        return;
      }

      const { order } = await res.json();
      if (order?.displayId) reportId.current = order.displayId;
    } catch {
      setSubmitError("Network problem — your order wasn't placed. Please try again.");
      setPhase("error");
      return;
    }
    // Hold the modeling animation briefly for perceived work, then confirm.
    const elapsed = Date.now() - startedAt;
    setTimeout(() => setPhase("done"), Math.max(0, 2000 - elapsed));
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && phase === "form") close();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "color-mix(in srgb, var(--nj2-ink-950) 55%, transparent)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "tpFade .2s ease",
      }}
    >
      <div
        ref={cardRef}
        className="tp-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderflow-title"
        style={{
          width: "min(880px, 100%)",
          maxHeight: "92vh",
          overflow: "hidden",
          boxShadow: "var(--nj2-shadow-xl)",
          display: "flex",
          flexDirection: "column",
          animation: "tpPop .3s var(--nj2-ease)",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 22px",
            borderBottom: "1px solid var(--nj2-border-subtle)",
          }}
        >
          <RoofMark size={26} />
          <div style={{ flex: 1 }}>
            <div
              id="orderflow-title"
              style={{
                fontFamily: "var(--nj2-font-display)",
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "-.02em",
              }}
            >
              {phase === "done"
                ? "Order confirmed"
                : phase === "modeling"
                  ? "Building your report"
                  : "Order a roof report"}
            </div>
            <div style={{ fontFamily: "var(--nj2-font-mono)", fontSize: 11, color: "var(--nj2-fg-3)" }}>
              {/* Provisional until the server assigns the real RD number on submit. */}
              {phase === "form" ? `${reportId.current} · draft` : reportId.current}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--nj2-border)",
              background: "var(--nj2-bg-card)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--nj2-fg-2)",
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {phase === "form" && (
          <>
            {/* stepper */}
            <div style={{ display: "flex", gap: 0, padding: "14px 22px 0" }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--nj2-font-mono)",
                      fontSize: 11,
                      fontWeight: 600,
                      flexShrink: 0,
                      background:
                        i < step
                          ? "var(--nj2-success)"
                          : i === step
                            ? "var(--tp-accent)"
                            : "var(--nj2-bg-muted)",
                      color: i <= step ? "#fff" : "var(--nj2-fg-3)",
                      transition: "all .25s",
                    }}
                  >
                    {i < step ? <Icon name="check" size={12} /> : i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: i === step ? 600 : 500,
                      color: i === step ? "var(--nj2-fg-1)" : "var(--nj2-fg-3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      style={{
                        flex: 1,
                        height: 1,
                        background: i < step ? "var(--nj2-success)" : "var(--nj2-border)",
                        margin: "0 8px",
                        transition: "background .25s",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div
              ref={scrollRef}
              className="tp-scroll"
              style={{ padding: "24px 22px", overflowY: "auto", flex: 1 }}
            >
              {/* STEP 0 — ADDRESS */}
              {step === 0 && (
                <div>
                  <StepTitle
                    k="Where's the roof?"
                    s="Enter the property address — no site visit needed. We'll pull the clearest aerial imagery available."
                  />
                  <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                    <Field label="Street address" req>
                      <div style={{ position: "relative" }}>
                        <Icon
                          name="map-pin"
                          size={16}
                          style={{ position: "absolute", left: 13, top: 14, color: "var(--nj2-fg-3)" }}
                        />
                        <input
                          className="tp-input"
                          style={{ paddingLeft: 38 }}
                          placeholder="1412 Magnolia Ave"
                          value={data.address}
                          onChange={(e) => set("address", e.target.value)}
                          autoFocus
                        />
                      </div>
                      {touched && data.address.trim().length <= 4 && (
                        <Err>Enter a valid street address</Err>
                      )}
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                      <Field label="City, state ZIP" req>
                        <input
                          className="tp-input"
                          placeholder="Fort Worth, TX 76116"
                          value={data.city}
                          onChange={(e) => set("city", e.target.value)}
                        />
                        {touched && data.city.trim().length <= 1 && <Err>Required</Err>}
                      </Field>
                      <Field label="Unit / bldg" hint="optional">
                        <input
                          className="tp-input"
                          placeholder="—"
                          value={data.unit}
                          onChange={(e) => set("unit", e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                  {/* imagery preview */}
                  <div
                    className="tp-graph-fine"
                    style={{
                      marginTop: 16,
                      borderRadius: "var(--nj2-r-lg)",
                      border: "1px solid var(--nj2-border)",
                      overflow: "hidden",
                      position: "relative",
                      height: 168,
                      background: "var(--nj2-bg-sunken)",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                      {data.address.trim().length > 4 ? (
                        <div style={{ textAlign: "center", maxWidth: 220 }}>
                          <RoofPlanCompact pitch="6/12" animate={data.address} key={data.address.length} />
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", color: "var(--nj2-fg-3)" }}>
                          <Icon name="satellite" size={22} style={{ color: "var(--nj2-fg-4)" }} />
                          <div
                            style={{
                              fontFamily: "var(--nj2-font-mono)",
                              fontSize: 11,
                              marginTop: 8,
                            }}
                          >
                            Imagery preview appears here
                          </div>
                        </div>
                      )}
                    </div>
                    <span
                      className="tp-pill"
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        padding: "3px 9px",
                        fontSize: 10.5,
                        fontFamily: "var(--nj2-font-mono)",
                      }}
                    >
                      <span
                        className="tp-dot"
                        style={{
                          color: "var(--nj2-success)",
                          background: "var(--nj2-success)",
                          width: 5,
                          height: 5,
                        }}
                      />
                      {data.address.trim().length > 4 ? "imagery located" : "awaiting address"}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 1 — REPORT TYPE */}
              {step === 1 && (
                <div>
                  <StepTitle
                    k="What should we measure?"
                    s="Choose the report type and how fast you need it back."
                  />
                  <div
                    style={{
                      fontFamily: "var(--nj2-font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      color: "var(--nj2-fg-3)",
                      margin: "18px 0 10px",
                    }}
                  >
                    Report type
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {Object.entries(RTYPES).map(([k, v]) => (
                      <Choice
                        key={k}
                        active={data.rtype === k}
                        onClick={() => set("rtype", k)}
                        icon={v.icon}
                        title={v.label}
                        sub={v.sub}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--nj2-font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      color: "var(--nj2-fg-3)",
                      margin: "22px 0 10px",
                    }}
                  >
                    Turnaround
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {Object.entries(TURN).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => set("turnaround", k)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 16px",
                          textAlign: "left",
                          cursor: "pointer",
                          borderRadius: "var(--nj2-r-lg)",
                          background:
                            data.turnaround === k ? "var(--tp-accent-soft)" : "var(--nj2-bg-card)",
                          border: `1.5px solid ${
                            data.turnaround === k ? "var(--tp-accent)" : "var(--nj2-border)"
                          }`,
                          transition: "all .15s",
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background:
                              data.turnaround === k ? "var(--tp-accent)" : "var(--nj2-bg-muted)",
                            color: data.turnaround === k ? "#fff" : "var(--nj2-fg-2)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <Icon name={v.icon} size={17} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{v.label}</div>
                          <div style={{ fontSize: 12, color: "var(--nj2-fg-3)" }}>{v.sub}</div>
                        </div>
                        <span
                          className="tp-num"
                          style={{
                            fontFamily: "var(--nj2-font-mono)",
                            fontWeight: 600,
                            fontSize: 14,
                            color: data.turnaround === k ? "var(--tp-accent)" : "var(--nj2-fg-2)",
                          }}
                        >
                          {v.time}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — DETAILS */}
              {step === 2 && (
                <div>
                  <StepTitle
                    k="Where do we send it?"
                    s="We'll email your PDF, ESX and XML here the moment QA signs off."
                  />
                  <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <Field label="Full name" req>
                        <input
                          className="tp-input"
                          placeholder="Marcus DeLeon"
                          value={data.name}
                          onChange={(e) => set("name", e.target.value)}
                          autoFocus
                        />
                        {touched && data.name.trim().length <= 1 && <Err>Required</Err>}
                      </Field>
                      <Field label="Company" hint="optional">
                        <input
                          className="tp-input"
                          placeholder="Lone Star Exteriors"
                          value={data.company}
                          onChange={(e) => set("company", e.target.value)}
                        />
                      </Field>
                    </div>
                    <Field label="Work email" req>
                      <div style={{ position: "relative" }}>
                        <Icon
                          name="mail"
                          size={16}
                          style={{ position: "absolute", left: 13, top: 14, color: "var(--nj2-fg-3)" }}
                        />
                        <input
                          className="tp-input"
                          style={{ paddingLeft: 38 }}
                          placeholder="you@company.com"
                          value={data.email}
                          onChange={(e) => set("email", e.target.value)}
                        />
                      </div>
                      {touched && !/\S+@\S+\.\S+/.test(data.email) && <Err>Enter a valid email</Err>}
                    </Field>
                    <Field label="Phone" hint="optional">
                      <input
                        className="tp-input"
                        placeholder="+1 (682) 325-7399"
                        value={data.phone}
                        onChange={(e) => set("phone", e.target.value)}
                      />
                    </Field>
                    <Field label="Notes for the estimator" hint="optional">
                      <textarea
                        className="tp-input"
                        rows={2}
                        placeholder="Detached garage in back — please include. Claim #HX-20413."
                        value={data.notes}
                        onChange={(e) => set("notes", e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* STEP 3 — REVIEW */}
              {step === 3 && (
                <div>
                  <StepTitle k="Review your order" s="One look, then we start the clock." />
                  <div
                    className="tp-card"
                    style={{ marginTop: 18, padding: 0, overflow: "hidden", boxShadow: "none" }}
                  >
                    <ReviewRow
                      icon="map-pin"
                      label="Property"
                      value={
                        <>
                          <div style={{ fontWeight: 600 }}>
                            {data.address || "—"}
                            {data.unit ? ` · ${data.unit}` : ""}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--nj2-font-mono)",
                              fontSize: 12,
                              color: "var(--nj2-fg-3)",
                            }}
                          >
                            {data.city || "—"}
                          </div>
                        </>
                      }
                      onEdit={() => setStep(0)}
                    />
                    <ReviewRow
                      icon={RTYPES[data.rtype].icon}
                      label="Report"
                      value={
                        <div style={{ fontWeight: 600 }}>
                          {RTYPES[data.rtype].label}{" "}
                          <span style={{ color: "var(--nj2-fg-3)", fontWeight: 400 }}>
                            · {RTYPES[data.rtype].sub}
                          </span>
                        </div>
                      }
                      onEdit={() => setStep(1)}
                    />
                    <ReviewRow
                      icon={TURN[data.turnaround].icon}
                      label="Turnaround"
                      value={
                        <div style={{ fontWeight: 600 }}>
                          {TURN[data.turnaround].label}{" "}
                          <span className="tp-num" style={{ color: "var(--tp-accent)" }}>
                            · {TURN[data.turnaround].time}
                          </span>
                        </div>
                      }
                      onEdit={() => setStep(1)}
                    />
                    <ReviewRow
                      icon="mail"
                      label="Deliver to"
                      value={
                        <>
                          <div style={{ fontWeight: 600 }}>
                            {data.name || "—"}
                            {data.company ? ` · ${data.company}` : ""}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--nj2-font-mono)",
                              fontSize: 12,
                              color: "var(--nj2-fg-3)",
                            }}
                          >
                            {data.email || "—"}
                          </div>
                        </>
                      }
                      onEdit={() => setStep(2)}
                      last
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 14,
                      padding: "12px 16px",
                      borderRadius: "var(--nj2-r-lg)",
                      background: "var(--tp-verify-soft)",
                      border: "1px solid color-mix(in srgb, var(--nj2-success) 28%, transparent)",
                    }}
                  >
                    <Icon name="shield-check" size={17} style={{ color: "var(--nj2-success)" }} />
                    <span
                      style={{
                        fontSize: 12.5,
                        color: "var(--nj2-success-ink, #054F38)",
                        lineHeight: 1.4,
                      }}
                    >
                      <b>Flat-rate, quoted same day.</b> You'll get a firm price by email before any
                      charge — no card needed to place this order.
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      marginTop: 14,
                      flexWrap: "wrap",
                      fontFamily: "var(--nj2-font-mono)",
                      fontSize: 11,
                      color: "var(--nj2-fg-3)",
                    }}
                  >
                    <span>PDF + ESX + XML</span>
                    <span style={{ color: "var(--nj2-fg-4)" }}>/</span>
                    <span>±2% guarantee</span>
                    <span style={{ color: "var(--nj2-fg-4)" }}>/</span>
                    <span>on-time or free</span>
                  </div>
                </div>
              )}
            </div>

            {/* footer nav */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 22px",
                borderTop: "1px solid var(--nj2-border-subtle)",
                background: "var(--nj2-bg-sunken)",
              }}
            >
              <button className="nj2-btn nj2-btn-ghost" onClick={step === 0 ? close : back}>
                {step === 0 ? (
                  "Cancel"
                ) : (
                  <>
                    <Icon name="arrow-left" size={14} /> Back
                  </>
                )}
              </button>
              <div
                style={{
                  flex: 1,
                  fontFamily: "var(--nj2-font-mono)",
                  fontSize: 11,
                  color: "var(--nj2-fg-3)",
                  textAlign: "center",
                }}
              >
                Step {step + 1} of {STEPS.length}
              </div>
              <button
                className="nj2-btn tp-btn-accent"
                onClick={next}
                style={{ minWidth: 132, justifyContent: "center" }}
              >
                {step === STEPS.length - 1 ? "Place order" : "Continue"}{" "}
                <span style={{ opacity: 0.8 }}>→</span>
              </button>
            </div>
          </>
        )}

        {/* MODELING */}
        {phase === "modeling" && <Modeling rtype={RTYPES[data.rtype].label} />}

        {/* DONE */}
        {phase === "done" && (
          <Confirmed
            data={data}
            id={reportId.current}
            turn={TURN[data.turnaround]}
            rtype={RTYPES[data.rtype].label}
            onClose={close}
          />
        )}

        {/* ERROR — order POST failed; let the user retry without losing input */}
        {phase === "error" && (
          <div style={{ padding: "44px 32px", textAlign: "center" }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: 999, margin: "0 auto 18px",
                display: "grid", placeItems: "center",
                background: "var(--nj2-danger-soft, #FBE9E7)", color: "var(--nj2-danger, #C0392B)",
              }}
            >
              <Icon name="alert-circle" size={26} />
            </div>
            <h3 style={{ fontFamily: "var(--nj2-font-display)", fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>
              Order not placed
            </h3>
            <p role="alert" style={{ fontSize: 14, color: "var(--nj2-fg-2)", margin: "0 auto 22px", maxWidth: 380, lineHeight: 1.55 }}>
              {submitError}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="nj2-btn nj2-btn-secondary" onClick={() => setPhase("form")}>
                Back to order
              </button>
              <button className="nj2-btn tp-btn-accent" onClick={submit}>
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes tpFade{from{opacity:0}to{opacity:1}}@keyframes tpPop{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

/* ───── sub-components ───── */
function StepTitle({ k, s }: { k: string; s: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--nj2-font-display)",
          fontWeight: 600,
          fontSize: 21,
          letterSpacing: "-.025em",
        }}
      >
        {k}
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: "var(--nj2-fg-2)",
          marginTop: 5,
          lineHeight: 1.5,
          maxWidth: 520,
        }}
      >
        {s}
      </div>
    </div>
  );
}

function Field({
  label,
  req,
  hint,
  children,
}: {
  label: string;
  req?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--nj2-fg-2)" }}>{label}</span>
        {req && <span style={{ color: "var(--nj2-danger)", fontSize: 12 }}>*</span>}
        {hint && (
          <span style={{ fontFamily: "var(--nj2-font-mono)", fontSize: 10.5, color: "var(--nj2-fg-4)" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 5,
        fontSize: 11.5,
        color: "var(--nj2-danger)",
      }}
    >
      <Icon name="alert-circle" size={12} />
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        padding: "14px 14px",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: "var(--nj2-r-lg)",
        background: active ? "var(--tp-accent-soft)" : "var(--nj2-bg-card)",
        border: `1.5px solid ${active ? "var(--tp-accent)" : "var(--nj2-border)"}`,
        transition: "all .15s",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: active ? "var(--tp-accent)" : "var(--nj2-bg-muted)",
          color: active ? "#fff" : "var(--nj2-fg-2)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={icon} size={17} />
      </span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "var(--nj2-fg-3)", marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  onEdit,
  last,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "15px 18px",
        borderBottom: last ? "none" : "1px solid var(--nj2-border-subtle)",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--tp-accent-soft)",
          color: "var(--tp-accent)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={16} />
      </span>
      <div
        style={{
          width: 78,
          fontFamily: "var(--nj2-font-mono)",
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--nj2-fg-3)",
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, fontSize: 14 }}>{value}</div>
      <button
        onClick={onEdit}
        className="nj2-btn nj2-btn-ghost nj2-btn-sm"
        style={{ color: "var(--tp-accent)" }}
      >
        Edit
      </button>
    </div>
  );
}

function Modeling({ rtype }: { rtype: string }) {
  const lines = [
    "Locating clearest aerial imagery…",
    "Tracing roof planes & facets…",
    "Computing pitch, area & line counts…",
    "Queuing for estimator QA review…",
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, lines.length - 1)), 680);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      style={{
        padding: "40px 30px 44px",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 32,
        alignItems: "center",
      }}
      className="tp-modeling"
    >
      <div
        className="tp-graph-fine"
        style={{
          borderRadius: "var(--nj2-r-lg)",
          border: "1px solid var(--nj2-border)",
          padding: 14,
          background: "var(--nj2-bg-sunken)",
        }}
      >
        <RoofPlanCompact pitch="6/12" animate={true} key={active} />
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--nj2-font-mono)",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--tp-accent)",
          }}
        >
          Building · {rtype}
        </div>
        <div
          style={{
            fontFamily: "var(--nj2-font-display)",
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: "-.025em",
            margin: "8px 0 22px",
          }}
        >
          Modeling your roof…
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                opacity: i <= active ? 1 : 0.4,
                transition: "opacity .3s",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background:
                    i < active
                      ? "var(--nj2-success)"
                      : i === active
                        ? "var(--tp-accent)"
                        : "var(--nj2-bg-muted)",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {i < active ? (
                  <Icon name="check" size={11} />
                ) : i === active ? (
                  <span
                    className="tp-spin"
                    style={{
                      width: 10,
                      height: 10,
                      border: "2px solid rgba(255,255,255,.4)",
                      borderTopColor: "#fff",
                      borderRadius: 999,
                    }}
                  />
                ) : (
                  <span
                    style={{ width: 5, height: 5, borderRadius: 999, background: "var(--nj2-fg-4)" }}
                  />
                )}
              </span>
              <span style={{ fontSize: 13.5, color: i <= active ? "var(--nj2-fg-1)" : "var(--nj2-fg-3)" }}>
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
      <style>{`.tp-spin{animation:tpSpin .7s linear infinite}@keyframes tpSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Confirmed({
  data,
  id,
  turn,
  rtype,
  onClose,
}: {
  data: OrderData;
  id: string;
  turn: TurnMeta;
  rtype: string;
  onClose: () => void;
}) {
  const timeline: [string, string, boolean][] = [
    ["Order received", "now", true],
    ["Imagery & modeling", "in progress", true],
    ["Estimator QA review", "next", false],
    [`Delivered · PDF · ESX · XML`, `~${turn.time}`, false],
  ];
  const stats: [string, string][] = [
    ["Report ID", id],
    ["Est. delivery", turn.time],
    ["Status", "In production"],
  ];
  return (
    <div className="tp-scroll" style={{ padding: "34px 30px 30px", overflowY: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: "var(--tp-verify-soft)",
            display: "grid",
            placeItems: "center",
            color: "var(--nj2-success)",
            boxShadow: "0 0 0 6px color-mix(in srgb, var(--nj2-success) 8%, transparent)",
          }}
        >
          <Icon name="check" size={28} />
        </span>
        <div
          style={{
            fontFamily: "var(--nj2-font-display)",
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: "-.03em",
            marginTop: 18,
          }}
        >
          You're in the queue.
        </div>
        <p style={{ fontSize: 14.5, color: "var(--nj2-fg-2)", marginTop: 8, maxWidth: 430, lineHeight: 1.55 }}>
          {rtype} report for{" "}
          <b style={{ color: "var(--nj2-fg-1)" }}>{data.address || "your property"}</b> is being
          drafted. We'll email{" "}
          {data.email ? <b style={{ color: "var(--nj2-fg-1)" }}>{data.email}</b> : "you"} the moment an
          estimator signs off.
        </p>
      </div>
      <div
        className="tp-card"
        style={{
          marginTop: 22,
          padding: 0,
          overflow: "hidden",
          boxShadow: "none",
          background: "var(--nj2-bg-sunken)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          {stats.map(([k, v], i) => (
            <div
              key={k}
              style={{
                padding: "16px 18px",
                borderRight: i < 2 ? "1px solid var(--nj2-border-subtle)" : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--nj2-font-mono)",
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--nj2-fg-3)",
                }}
              >
                {k}
              </div>
              <div
                className="tp-num"
                style={{
                  fontFamily: "var(--nj2-font-display)",
                  fontWeight: 600,
                  fontSize: 16,
                  marginTop: 4,
                  color: i === 2 ? "var(--nj2-success)" : "var(--nj2-fg-1)",
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* timeline */}
      <div style={{ marginTop: 18 }}>
        {timeline.map(([t, meta, on], i, arr) => (
          <div key={i} style={{ display: "flex", gap: 13 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 999,
                  background: on ? "var(--tp-accent)" : "var(--nj2-bg-card)",
                  border: `2px solid ${on ? "var(--tp-accent)" : "var(--nj2-border-strong)"}`,
                  marginTop: 3,
                }}
              />
              {i < arr.length - 1 && (
                <span
                  style={{
                    width: 2,
                    flex: 1,
                    background: on ? "var(--tp-accent)" : "var(--nj2-border)",
                    minHeight: 22,
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: 14 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: on ? 600 : 500,
                  color: on ? "var(--nj2-fg-1)" : "var(--nj2-fg-3)",
                }}
              >
                {t}
              </div>
              <div style={{ fontFamily: "var(--nj2-font-mono)", fontSize: 11, color: "var(--nj2-fg-4)" }}>
                {meta}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          className="nj2-btn nj2-btn-secondary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={onClose}
        >
          Back to site
        </button>
        <button
          className="nj2-btn tp-btn-accent"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={onClose}
        >
          <Icon name="plus" size={14} /> Order another
        </button>
      </div>
    </div>
  );
}
