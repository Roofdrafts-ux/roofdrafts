// ════════════════════════════════════════════════════════════════
// Truepitch — sections part 2: SLA, Coverage, Testimonials,
//             Pricing, FAQ, CTAFooter
// ════════════════════════════════════════════════════════════════

/* ───────── SLA / TURNAROUND ───────── */
function SLA({ onOrder }) {
  const tiers = [
    { name: 'Standard', time: '6–10 hr', sub: 'Median 6.4 hr', icon: 'clock', note: 'Order before 4pm CT for same-day delivery.', accent: 'var(--tp-blue)' },
    { name: 'Rush', time: '3 hr', sub: 'Priority queue', icon: 'zap', note: 'Jump the line when the adjuster is on the roof tomorrow.', accent: 'var(--nj2-mod-hire)' },
    { name: 'Bulk', time: 'Overnight', sub: '10+ properties', icon: 'layers', note: 'Batch a whole storm route; delivered by 7am local.', accent: 'var(--nj2-mod-seal)' },
  ];
  return (
    <section id="sla" style={{ padding: '92px 28px', scrollMarginTop: 70 }}>
      <div style={{ maxWidth: 'var(--tp-maxw)', margin: '0 auto' }}>
        <div className="tp-sla-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 56, alignItems: 'center' }}>
          <div>
            <Eyebrow>Turnaround &amp; SLA</Eyebrow>
            <h2 className="tp-h2">Speed is the product. We treat the clock like a contract.</h2>
            <p className="tp-lede" style={{ marginTop: 16, maxWidth: 460 }}>
              Every order starts a timer the moment it's placed. Miss a deadline and the report is on us — that's the Roofdrafts on-time guarantee, written into every account.
            </p>
            <div className="tp-ledger" style={{ margin: '26px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
              {[['shield-check', 'On-time or it\u2019s free'], ['user-check', 'Human-verified, never raw AI'], ['target', '\u00b12% area tolerance'], ['refresh-cw', 'Free revisions for 30 days']].map(([ic, t]) => (
                <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <Icon name={ic} size={16} style={{ color: 'var(--tp-accent)', marginTop: 1 }} />
                  <span style={{ fontSize: 14, color: 'var(--nj2-fg-2)', lineHeight: 1.4 }}>{t}</span>
                </div>
              ))}
            </div>
            <button className="nj2-btn tp-btn-accent" style={{ marginTop: 28 }} onClick={onOrder}>Order a report <span style={{ opacity: .8 }}>→</span></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tiers.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div className="tp-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 18 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: `color-mix(in srgb, ${t.accent} 12%, transparent)`, display: 'grid', placeItems: 'center', color: t.accent, flexShrink: 0 }}>
                    <Icon name={t.icon} size={19} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 16, letterSpacing: '-.02em' }}>{t.name}</span>
                      <span style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 11, color: 'var(--nj2-fg-3)' }}>{t.sub}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--nj2-fg-2)', marginTop: 3 }}>{t.note}</div>
                  </div>
                  <div className="tp-num" style={{ fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 22, letterSpacing: '-.03em', color: t.accent, whiteSpace: 'nowrap' }}>{t.time}</div>
                </div>
              </Reveal>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--nj2-r-lg)', border: '1px dashed var(--nj2-border)', background: 'var(--nj2-bg-sunken)' }}>
              <span className="tp-dot" style={{ color: 'var(--nj2-success)', background: 'var(--nj2-success)' }} />
              <span style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 11.5, color: 'var(--nj2-fg-2)' }}>Live queue · <span style={{ color: 'var(--nj2-fg-1)', fontWeight: 600 }}>17 reports</span> in production · avg <span style={{ color: 'var(--nj2-fg-1)', fontWeight: 600 }}>5h 48m</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── COVERAGE ───────── */
function Coverage() {
  const cities = ['Fort Worth', 'Dallas', 'Houston', 'Austin', 'Oklahoma City', 'Denver', 'Kansas City', 'Atlanta', 'Tampa', 'Nashville', 'Phoenix', 'Charlotte', 'St. Louis', 'Memphis', 'New Orleans', 'Birmingham'];
  return (
    <section id="coverage" style={{ padding: '88px 28px', background: 'var(--tp-navy)', color: '#fff', position: 'relative', overflow: 'hidden', scrollMarginTop: 70 }}>
      <div className="tp-dotgrid" style={{ position: 'absolute', inset: 0, opacity: .25, background: 'radial-gradient(circle, rgba(255,255,255,.08) .9px, transparent .9px)', backgroundSize: '24px 24px' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 80% 20%, color-mix(in srgb, var(--tp-accent) 30%, transparent), transparent 60%)', opacity: .5 }} />
      <div style={{ maxWidth: 'var(--tp-maxw)', margin: '0 auto', position: 'relative' }}>
        <div className="tp-cov-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div className="tp-eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}><span className="tp-tick" style={{ background: 'var(--nj2-lime)' }} />Coverage</div>
            <h2 className="tp-h2" style={{ color: '#fff' }}>If imagery exists, we can measure it.</h2>
            <p className="tp-lede" style={{ marginTop: 16, maxWidth: 440, color: 'rgba(255,255,255,.66)' }}>
              All 50 states, every county. Coastal storm zones, rural acreage, dense downtown cores — multi-source imagery means we draft where drones can't fly and ladders won't reach.
            </p>
            <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>
              {[['50', 'states'], ['3,140+', 'counties'], ['24/7', 'storm response']].map(([v, l]) => (
                <div key={l}>
                  <div className="tp-num" style={{ fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 30, letterSpacing: '-.03em' }}>{v}</div>
                  <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="tp-card" style={{ background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.12)', padding: 22, backdropFilter: 'blur(6px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Active metros</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--nj2-font-mono)', fontSize: 11, color: 'var(--nj2-lime)' }}>
                  <span className="tp-dot" style={{ color: 'var(--nj2-lime)', background: 'var(--nj2-lime)' }} /> drafting now
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cities.map(c => (
                  <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)', fontSize: 12.5, color: 'rgba(255,255,255,.82)' }}>
                    <Icon name="map-pin" size={11} style={{ color: 'var(--nj2-lime)' }} />{c}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 11px', borderRadius: 999, fontSize: 12.5, color: 'rgba(255,255,255,.5)', fontFamily: 'var(--nj2-font-mono)' }}>+ everywhere else</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── TESTIMONIALS ───────── */
function Testimonials() {
  const quotes = [
    { q: 'We dropped our old report vendor the week we found Roofdrafts. ESX drops into Xactimate clean every time — zero re-tracing.', n: 'Marcus DeLeon', r: 'Owner · Lone Star Exteriors', i: 'MD', sq: '24.2', acc: 'var(--tp-blue)' },
    { q: 'Ordered at 9am on a hail route, had nineteen reports back before the crews finished tear-off. The on-time guarantee is real.', n: 'Priya Raman', r: 'Ops Lead · Summit Restoration', i: 'PR', sq: '31.7', acc: 'var(--nj2-mod-seal)' },
    { q: 'As an independent adjuster, the ±2% tolerance means I never get pushback on area. It pays for itself on a single claim.', n: 'Dwayne Foster', r: 'Independent Adjuster', i: 'DF', sq: '18.4', acc: 'var(--nj2-mod-hire)' },
  ];
  return (
    <section style={{ padding: '92px 28px' }}>
      <div style={{ maxWidth: 'var(--tp-maxw)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
          <Eyebrow style={{ justifyContent: 'center' }}>Trusted by pros</Eyebrow>
          <h2 className="tp-h2">The crews who can't afford a wrong number.</h2>
        </div>
        <div className="tp-quote-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 46 }}>
          {quotes.map((q, i) => (
            <Reveal key={q.n} delay={i * 90}>
              <div className="tp-card" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {[0, 1, 2, 3, 4].map(s => <Icon key={s} name="star" size={13} style={{ color: '#E8B33D' }} />)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--nj2-fg-1)', margin: 0, flex: 1, textWrap: 'pretty' }}>&ldquo;{q.q}&rdquo;</p>
                <div className="tp-ledger" style={{ margin: '20px 0 16px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 999, background: `color-mix(in srgb, ${q.acc} 16%, transparent)`, color: q.acc, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13, fontFamily: 'var(--nj2-font-display)' }}>{q.i}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{q.n}</div>
                    <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 11, color: 'var(--nj2-fg-3)' }}>{q.r}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tp-num" style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 15, fontWeight: 600, color: q.acc }}>{q.sq}</div>
                    <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 9, color: 'var(--nj2-fg-4)', letterSpacing: '.1em' }}>SQ AVG</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── PRICING ───────── */
function Pricing({ onOrder }) {
  const plans = [
    { name: 'Residential', icon: 'house', desc: 'Single & multi-family homes', price: '$15', unit: 'per report', features: ['PDF + ESX + XML', 'Pitch, squares & waste tables', '6–10 hr standard turnaround', 'Free revisions, 30 days'], cta: 'Order residential', highlight: false },
    { name: 'Commercial', icon: 'building-2', desc: 'Flat, low-slope & multi-building', price: '$35', unit: 'per building', features: ['Everything in Residential', 'Parapets & penetration counts', 'Up to 50 buildings per order', 'Dedicated estimator on file'], cta: 'Order commercial', highlight: true },
    { name: '3D / ESX', icon: 'box', desc: 'Wall elevations + roof', price: '$25', unit: 'per report', features: ['Full 3D wall + roof model', 'Native Xactimate .ESX', 'Siding & gutter linework', 'Priority QA review'], cta: 'Order 3D', highlight: false },
  ];
  return (
    <section id="pricing" style={{ padding: '92px 28px', background: 'var(--nj2-bg-card)', borderTop: '1px solid var(--nj2-border-subtle)', borderBottom: '1px solid var(--nj2-border-subtle)', scrollMarginTop: 70 }}>
      <div style={{ maxWidth: 'var(--tp-maxw)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <Eyebrow style={{ justifyContent: 'center' }}>Pricing</Eyebrow>
          <h2 className="tp-h2">Flat-rate, per report. No subscriptions, no surprises.</h2>
          <p className="tp-lede" style={{ margin: '16px auto 0', maxWidth: 540 }}>Reports start at <b style={{ color: 'var(--nj2-fg-1)' }}>$15</b> — a fraction of what EagleView or Hover charge for the same estimate. Volume and storm-route pricing scale down from there, quoted the same day.</p>
        </div>
        <div className="tp-price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 48, alignItems: 'stretch' }}>
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 90}>
              <div className="tp-card" style={{
                padding: 26, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
                borderColor: p.highlight ? 'var(--tp-accent)' : 'var(--nj2-border)',
                boxShadow: p.highlight ? '0 18px 44px -16px var(--tp-accent-ring)' : 'var(--nj2-shadow-sm)',
              }}>
                {p.highlight && <span style={{ position: 'absolute', top: -11, left: 26, fontFamily: 'var(--nj2-font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', background: 'var(--tp-accent)', padding: '4px 10px', borderRadius: 999 }}>Most ordered</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--tp-accent-soft)', display: 'grid', placeItems: 'center', color: 'var(--tp-accent)' }}><Icon name={p.icon} size={18} /></span>
                  <div>
                    <div style={{ fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 17, letterSpacing: '-.02em' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--nj2-fg-3)' }}>{p.desc}</div>
                  </div>
                </div>
                <div style={{ margin: '20px 0 18px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 38, letterSpacing: '-.03em' }} className="tp-num">{p.price}</span>
                  <span style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 12, color: 'var(--nj2-fg-3)' }}>{p.unit}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: 'var(--nj2-fg-2)' }}>
                      <Icon name="check" size={14} style={{ color: 'var(--nj2-success)', marginTop: 2 }} /> {f}
                    </div>
                  ))}
                </div>
                <button className={`nj2-btn nj2-btn-lg ${p.highlight ? 'tp-btn-accent' : 'nj2-btn-secondary'}`} style={{ marginTop: 22, justifyContent: 'center' }} onClick={onOrder}>{p.cta}</button>
              </div>
            </Reveal>
          ))}
        </div>
        {/* add-ons + competitor comparison */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 20, fontFamily: 'var(--nj2-font-mono)', fontSize: 11.5, color: 'var(--nj2-fg-3)' }}>
          <span>+ $10 rush · 3 hr</span><span style={{ color: 'var(--nj2-fg-4)' }}>/</span>
          <span>volume from $12</span><span style={{ color: 'var(--nj2-fg-4)' }}>/</span>
          <span>no card to start</span><span style={{ color: 'var(--nj2-fg-4)' }}>/</span>
          <span>pay only on delivery</span>
        </div>
        <div className="tp-cmp" style={{ maxWidth: 760, margin: '40px auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[['Roofdrafts', '$15', true], ['Hover', '~$45', false], ['EagleView', '~$90', false]].map(([n, v, me]) => (
            <div key={n} className="tp-card" style={{ padding: '16px 18px', textAlign: 'center', borderColor: me ? 'var(--tp-accent)' : 'var(--nj2-border)', background: me ? 'var(--tp-accent-soft)' : 'var(--nj2-bg-card)', boxShadow: 'none' }}>
              <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: me ? 'var(--tp-accent)' : 'var(--nj2-fg-3)' }}>{n}</div>
              <div className="tp-num" style={{ fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 26, letterSpacing: '-.03em', marginTop: 4, color: me ? 'var(--tp-accent)' : 'var(--nj2-fg-2)' }}>{v}</div>
              <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 10, color: 'var(--nj2-fg-4)', marginTop: 2 }}>residential report</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--nj2-font-mono)', fontSize: 10.5, color: 'var(--nj2-fg-4)', marginTop: 12 }}>Competitor prices are typical published rates · for comparison only</div>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
function FAQ() {
  const items = [
    ['How accurate are the measurements?', 'Every report is guaranteed within \u00b12% of true roof area. We model from high-resolution aerial imagery, then a human estimator verifies pitch, facet count and linework before release. If an adjuster disputes the area, we re-measure free.'],
    ['Do I get a native Xactimate file?', 'Yes. Every order ships as a signed PDF, a native .ESX, and raw XML. The ESX drops straight into Xactimate with pitch, squares and waste already populated \u2014 no re-tracing.'],
    ['How fast is delivery, really?', 'Median turnaround is 6.4 hours; standard SLA is 6\u201310 hours. Orders placed before 4pm CT are delivered same day. Rush (3 hr) and overnight bulk options are available at checkout.'],
    ['What if the imagery is out of date or obstructed?', 'We pull from multiple imagery sources and pick the clearest, most recent capture. If no source meets our standard, we tell you before charging \u2014 you\u2019re never billed for a report we can\u2019t stand behind.'],
    ['Can you handle storm-route volume?', 'That\u2019s our busiest lane. Batch 10+ properties for overnight delivery by 7am local, with a dedicated estimator and consolidated billing. Volume pricing is quoted same day.'],
    ['Do you cover commercial and low-slope roofs?', 'Yes \u2014 warehouses, retail, multi-building campuses and flat roofs, with parapets, drains and penetration counts. Up to 50 buildings on a single order.'],
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" style={{ padding: '92px 28px', scrollMarginTop: 70 }}>
      <div className="tp-faq-wrap" style={{ maxWidth: 'var(--tp-maxw)', margin: '0 auto', display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 56 }}>
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="tp-h2">Questions, before<br />you order.</h2>
          <p className="tp-lede" style={{ marginTop: 16 }}>Still unsure? Talk to a real estimator — no bots, no queue.</p>
          <a className="nj2-btn nj2-btn-secondary" href="tel:+16823257399" style={{ marginTop: 20 }}><Icon name="phone" size={14} /> +1 (682) 325-7399</a>
        </div>
        <div>
          {items.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderTop: '1px solid var(--nj2-border)', borderBottom: i === items.length - 1 ? '1px solid var(--nj2-border)' : 'none' }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--nj2-fg-1)' }}>
                  <span style={{ flex: 1, fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 16, letterSpacing: '-.015em' }}>{q}</span>
                  <Icon name={isOpen ? 'minus' : 'plus'} size={17} style={{ color: 'var(--tp-accent)' }} />
                </button>
                <div style={{ maxHeight: isOpen ? 260 : 0, overflow: 'hidden', transition: 'max-height .35s var(--nj2-ease)' }}>
                  <p style={{ margin: 0, padding: '0 32px 20px 4px', fontSize: 14, lineHeight: 1.6, color: 'var(--nj2-fg-2)', textWrap: 'pretty' }}>{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── CTA + FOOTER ───────── */
function CTAFooter({ onOrder }) {
  return (
    <section id="contact" style={{ background: 'var(--tp-navy-3)', color: '#fff', padding: '84px 28px 36px', position: 'relative', overflow: 'hidden', scrollMarginTop: 70 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 70% at 18% 0%, color-mix(in srgb, var(--tp-accent) 26%, transparent), transparent 62%)' }} />
      <div className="tp-graph" style={{ position: 'absolute', inset: 0, opacity: .04 }} />
      <div style={{ maxWidth: 'var(--tp-maxw)', margin: '0 auto', position: 'relative' }}>
        <div className="tp-cta-top" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56, alignItems: 'end', paddingBottom: 56, borderBottom: '1px solid rgba(191,228,239,.14)' }}>
          <div>
            <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 11, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: '#70707A' }}>Get started</div>
            <h2 style={{ fontFamily: 'var(--nj2-font-display)', fontWeight: 600, fontSize: 'clamp(34px,4.4vw,58px)', letterSpacing: '-.04em', lineHeight: 1.04, margin: '14px 0 0', maxWidth: 680, textWrap: 'balance' }}>
              Your next estimate is one address away.
            </h2>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 16, marginTop: 16, maxWidth: 440, lineHeight: 1.55 }}>Drop a property address and have an estimate-ready report back before the day's done.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="nj2-btn nj2-btn-lg tp-btn-accent" style={{ justifyContent: 'center' }} onClick={onOrder}>Order a report <span>→</span></button>
            <a className="nj2-btn nj2-btn-lg" href="mailto:support@roofdrafts.com?subject=Talk%20to%20an%20estimator" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(191,228,239,.28)', justifyContent: 'center' }}>Talk to an estimator</a>
            <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 11, color: '#4A4A52', textAlign: 'center', marginTop: 4 }}>On-time guarantee · 50-state coverage</div>
          </div>
        </div>
        <div className="tp-foot-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, paddingTop: 48, borderTop: '1px solid rgba(191,228,239,.10)', marginTop: 0 }}>
          <div>
            <Wordmark light size={28} />
            <div style={{ fontSize: 13, color: '#A6A6AE', marginTop: 14, maxWidth: 250, lineHeight: 1.55 }}>Precision roof diagrams &amp; reports for the people who build, restore and adjust.</div>
            <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 10.5, color: '#4A4A52', marginTop: 14, lineHeight: 1.8 }}>
              <a href="mailto:support@roofdrafts.com" style={{ color: 'inherit' }}>support@roofdrafts.com</a> · <a href="tel:+16823257399" style={{ color: 'inherit' }}>+1 (682) 325-7399</a><br />1107 7th Ave, Fort Worth, TX 76104
            </div>
          </div>
          {[['Reports', [['Residential', '#formats'], ['Commercial', '#formats'], ['3D / ESX wall', '#formats'], ['Sample report', '#sample']]],
            ['Company', [['How it works', '#how'], ['Coverage', '#coverage'], ['Pricing', '#pricing'], ['Contact', 'mailto:support@roofdrafts.com']]],
            ['Legal', [['Privacy policy', '#'], ['Terms', '#'], ['Accessibility', '#'], ['On-time guarantee', '#sla']]]].map(([h, items]) => (
            <div key={h}>
              <div style={{ fontFamily: 'var(--nj2-font-mono)', fontSize: 10.5, fontWeight: 600, color: '#fff', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 14 }}>{h}</div>
              {items.map(([it, href]) => <a key={it} href={href} style={{ display: 'block', fontSize: 13, color: '#A6A6AE', padding: '5px 0', cursor: 'pointer', textDecoration: 'none' }}>{it}</a>)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 44, paddingTop: 22, borderTop: '1px solid rgba(191,228,239,.10)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--nj2-font-mono)', fontSize: 11, color: 'rgba(191,228,239,.45)', flexWrap: 'wrap', gap: 12 }}>
          <span>© 2026 Roofdrafts</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="tp-dot" style={{ color: 'var(--nj2-success)', background: 'var(--nj2-success)' }} /> All systems operational
          </span>
          <span>Fort Worth · Bengaluru</span>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { SLA, Coverage, Testimonials, Pricing, FAQ, CTAFooter });
