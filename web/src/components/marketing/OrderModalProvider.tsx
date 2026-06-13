"use client";
// Client island that owns the order-modal state for the (otherwise static,
// server-rendered) marketing page. Provides openOrder() via context so server
// section components can embed client <OrderButton>s without prop-threading a
// callback across the server/client boundary. Also hosts the modal, the
// floating order button, and the chat widget.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Icon } from "../primitives";
import { OrderFlow } from "../OrderFlow";
import { ChatWidget } from "../chat/ChatWidget";

const OrderModalContext = createContext<{ openOrder: () => void }>({ openOrder: () => {} });

/** Hook for client components to open the order modal. */
export function useOrderModal() {
  return useContext(OrderModalContext);
}

export function OrderModalProvider({ children }: { children: React.ReactNode }) {
  const [orderOpen, setOrderOpen] = useState(false);
  const openOrder = useCallback(() => setOrderOpen(true), []);

  // Deep-link: /?order=1 (e.g. the dashboard "Order a report" button).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("order") === "1") setOrderOpen(true);
  }, []);

  return (
    <OrderModalContext.Provider value={{ openOrder }}>
      {children}

      <OrderFlow open={orderOpen} onClose={() => setOrderOpen(false)} />
      <ChatWidget />

      {/* floating order button — stacked above the chat launcher */}
      <button
        onClick={openOrder}
        aria-label="Order a report"
        style={{
          position: "fixed",
          right: 22,
          bottom: 90,
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
          boxShadow: "0 10px 30px -8px var(--tp-accent-ring), 0 4px 10px rgba(0,0,0,.12)",
          transition: "transform .15s var(--nj2-ease-io)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
      >
        <Icon name="ruler" size={17} /> Order a report
      </button>
    </OrderModalContext.Provider>
  );
}

/**
 * Drop-in replacement for the marketing order CTAs. Renders an identical
 * <button> (same className/style/children) wired to openOrder() — so server
 * section components can keep their exact markup.
 */
export function OrderButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { openOrder } = useOrderModal();
  return (
    <button className={className} style={style} onClick={openOrder}>
      {children}
    </button>
  );
}
