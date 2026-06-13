// ════════════════════════════════════════════════════════════════
// Roofdrafts — marketing app shell (server component)
// Static sections render on the server; the OrderModalProvider client
// island owns the order-modal state, floating CTA, and chat widget.
// ════════════════════════════════════════════════════════════════
import { OrderModalProvider } from "./marketing/OrderModalProvider";
import { Nav } from "./marketing/Nav";
import { FAQ } from "./marketing/FAQ";
import { Hero, TrustBar, HowItWorks, Formats } from "./Marketing";
import { SLA, Coverage, Testimonials, Pricing, CTAFooter } from "./Marketing2";

export function App() {
  return (
    <OrderModalProvider>
      <a href="#content" className="rd-skip-link">Skip to content</a>
      <Nav />
      <main id="content">
        <Hero headline="Accurate roof diagrams," variant="default" />
        <TrustBar />
        <HowItWorks />
        <Formats />
        <SLA />
        <Coverage />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTAFooter />
      </main>
    </OrderModalProvider>
  );
}
