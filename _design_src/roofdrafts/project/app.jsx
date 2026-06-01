// ════════════════════════════════════════════════════════════════
// Truepitch — app shell + Tweaks
// ════════════════════════════════════════════════════════════════

const ACCENTS = {
  Clay:    { c: '#BE5630', c6: '#A2451F', soft: '#FBECE4', ring: 'rgba(190,86,48,.30)' },
  Slate:   { c: '#2A6076', c6: '#1C4A5C', soft: '#E6EEF1', ring: 'rgba(42,96,118,.28)' },
  Forest:  { c: '#3C7A52', c6: '#2C5C3D', soft: '#E4F1E8', ring: 'rgba(60,122,82,.28)' },
  Amber:   { c: '#B7791F', c6: '#8F5E14', soft: '#FBEFCF', ring: 'rgba(183,121,31,.28)' },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "Clay",
  "dark": false,
  "heroVariant": "default",
  "headline": "Accurate roof diagrams,",
  "showPricing": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [orderOpen, setOrderOpen] = useState(false);

  // apply accent + theme to :root
  useEffect(() => {
    const a = ACCENTS[t.accent] || ACCENTS.Clay;
    const r = document.documentElement;
    r.style.setProperty('--tp-accent', a.c);
    r.style.setProperty('--tp-accent-600', a.c6);
    r.style.setProperty('--tp-accent-soft', a.soft);
    r.style.setProperty('--tp-accent-ring', a.ring);
    r.setAttribute('data-theme', t.dark ? 'dark' : 'light');
  }, [t.accent, t.dark]);

  const openOrder = () => setOrderOpen(true);

  return (
    <div>
      <Nav onOrder={openOrder} />
      <Hero onOrder={openOrder} headline={t.headline} variant={t.heroVariant} />
      <TrustBar />
      <HowItWorks onOrder={openOrder} />
      <Formats />
      <SLA onOrder={openOrder} />
      <Coverage />
      <Testimonials />
      {t.showPricing && <Pricing onOrder={openOrder} />}
      <FAQ />
      <CTAFooter onOrder={openOrder} />

      <OrderFlow open={orderOpen} onClose={() => setOrderOpen(false)} />

      {/* floating order button */}
      <button onClick={openOrder} aria-label="Order a report" style={{
        position: 'fixed', right: 22, bottom: 22, zIndex: 80,
        display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 20px',
        borderRadius: 999, border: 'none', cursor: 'pointer', color: '#fff', background: 'var(--tp-accent)',
        fontFamily: 'var(--nj2-font-body)', fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap',
        boxShadow: '0 10px 30px -8px var(--tp-accent-ring), 0 4px 10px rgba(0,0,0,.12)',
        transition: 'transform .15s var(--nj2-ease-io)',
      }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
        <Icon name="ruler" size={17} /> Order a report
      </button>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={(ACCENTS[t.accent] || ACCENTS.Clay).c}
          options={Object.values(ACCENTS).map(a => a.c)}
          onChange={(v) => { const name = Object.keys(ACCENTS).find(k => ACCENTS[k].c === v) || 'Clay'; setTweak('accent', name); }} />
        <TweakToggle label="Blueprint mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />

        <TweakSection label="Hero" />
        <TweakRadio label="Angle" value={t.heroVariant}
          options={['default', 'speed', 'trust']}
          onChange={(v) => setTweak('heroVariant', v)} />
        <TweakText label="Headline (default angle)" value={t.headline}
          onChange={(v) => setTweak('headline', v)} />

        <TweakSection label="Sections" />
        <TweakToggle label="Show pricing" value={t.showPricing} onChange={(v) => setTweak('showPricing', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
