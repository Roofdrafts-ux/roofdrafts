import type { EmailMessage, OrderEmailEvent } from "./types";

export interface OrderEmailContext {
  toEmail: string;
  toName?: string | null;
  displayId: string;
  address: string;
  /** Absolute URL to the customer's order on the dashboard. */
  orderUrl: string;
  priceUsd?: number | null; // cents
  etaLabel?: string | null;
}

const BRAND = "#BE5630";
const INK = "#15120D";
const INK2 = "#585041";
const PAPER = "#FAF6EE";

function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:${PAPER};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${INK};">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:24px;">
      <span style="color:${INK};">roof</span><span style="color:#A99C7E;">drafts</span>
    </div>
    <h1 style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin:0 0 12px;color:${INK};">${title}</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #DFD5BF;margin:28px 0 16px;" />
    <p style="font-size:11px;color:#A99C7E;margin:0;">Roofdrafts — aerial roof-measurement reports. This is a transactional message about your order.</p>
  </div></body></html>`;
}

function btn(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:6px;margin:8px 0;">${label}</a>`;
}

function dollars(cents?: number | null): string | null {
  if (cents == null) return null;
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function p(text: string): string {
  return `<p style="font-size:14px;line-height:1.6;color:${INK2};margin:0 0 12px;">${text}</p>`;
}

const greeting = (name?: string | null) => (name ? `Hi ${name},` : "Hi,");

export function renderOrderEmail(event: OrderEmailEvent, c: OrderEmailContext): EmailMessage {
  const who = greeting(c.toName);
  const price = dollars(c.priceUsd);

  switch (event) {
    case "received":
      return {
        to: c.toEmail,
        subject: `Order received — ${c.displayId}`,
        text: `${who}\n\nWe've received your roof report order ${c.displayId} for ${c.address}. Our estimators are queuing it now${c.etaLabel ? ` — estimated delivery ${c.etaLabel}` : ""}. Track it: ${c.orderUrl}`,
        html: shell(
          "Order received",
          p(who) +
            p(`We've received your roof report order <b>${c.displayId}</b> for <b>${c.address}</b>.`) +
            p(`Our estimators are queuing it now${c.etaLabel ? ` — estimated delivery <b>${c.etaLabel}</b>` : ""}.`) +
            btn(c.orderUrl, "Track your order")
        ),
      };
    case "in_production":
      return {
        to: c.toEmail,
        subject: `In production — ${c.displayId}`,
        text: `${who}\n\nGood news — an estimator has started modeling ${c.displayId} (${c.address}). We'll email you the moment QA signs off. ${c.orderUrl}`,
        html: shell(
          "Your report is in production",
          p(who) +
            p(`An estimator has started modeling <b>${c.displayId}</b> (${c.address}).`) +
            p(`We'll email you the moment QA signs off and your files are ready.`) +
            btn(c.orderUrl, "View status")
        ),
      };
    case "delivered":
      return {
        to: c.toEmail,
        subject: `Your report is ready — ${c.displayId}`,
        text: `${who}\n\nYour roof report ${c.displayId} for ${c.address} is ready. Download your PDF, Xactimate ESX and XML: ${c.orderUrl}`,
        html: shell(
          "Your report is ready",
          p(who) +
            p(`Your roof report <b>${c.displayId}</b> for <b>${c.address}</b> has passed QA and is ready.`) +
            p(`Download your <b>PDF</b>, <b>Xactimate ESX</b> and <b>XML</b> from your dashboard.`) +
            btn(c.orderUrl, "Download your report")
        ),
      };
    case "revision_requested":
      return {
        to: c.toEmail,
        subject: `Revision in progress — ${c.displayId}`,
        text: `${who}\n\nWe're revising ${c.displayId} (${c.address}). You'll get an updated report shortly. ${c.orderUrl}`,
        html: shell(
          "Revision in progress",
          p(who) +
            p(`We're revising <b>${c.displayId}</b> (${c.address}) and will send an updated report shortly.`) +
            btn(c.orderUrl, "View status")
        ),
      };
    case "payment_received":
      return {
        to: c.toEmail,
        subject: `Payment received — ${c.displayId}`,
        text: `${who}\n\nThanks — we've received your payment${price ? ` of ${price}` : ""} for ${c.displayId}. ${c.orderUrl}`,
        html: shell(
          "Payment received",
          p(who) +
            p(`Thanks — we've received your payment${price ? ` of <b>${price}</b>` : ""} for order <b>${c.displayId}</b>.`) +
            btn(c.orderUrl, "View order")
        ),
      };
  }
}
