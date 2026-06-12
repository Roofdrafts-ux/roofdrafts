import type { EmailMessage } from "./types";
import { escapeHtml } from "../chat";

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
    <p style="font-size:11px;color:#A99C7E;margin:0;">Roofdrafts — aerial roof-measurement reports. This is an automated security message about your account.</p>
  </div></body></html>`;
}
function btn(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:6px;margin:8px 0;">${label}</a>`;
}
function p(text: string): string {
  return `<p style="font-size:14px;line-height:1.6;color:${INK2};margin:0 0 12px;">${text}</p>`;
}
function fallback(url: string): string {
  return `<p style="font-size:12px;line-height:1.5;color:#A99C7E;margin:12px 0 0;word-break:break-all;">If the button doesn't work, paste this link into your browser:<br/>${escapeHtml(url)}</p>`;
}
const greet = (name?: string | null) => (name ? `Hi ${escapeHtml(name)},` : "Hi,");

export function renderPasswordResetEmail(
  toEmail: string,
  name: string | null,
  url: string
): EmailMessage {
  return {
    to: toEmail,
    subject: "Reset your Roofdrafts password",
    text: `${name ? `Hi ${name},` : "Hi,"}\n\nWe got a request to reset your Roofdrafts password. Open this link within the next hour to choose a new one:\n${url}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.`,
    html: shell(
      "Reset your password",
      p(greet(name)) +
        p("We got a request to reset your Roofdrafts password. Choose a new one within the next hour:") +
        btn(url, "Reset password") +
        p(`If you didn't ask for this, you can safely ignore this email — your password won't change.`) +
        fallback(url)
    ),
  };
}

export function renderVerifyEmail(
  toEmail: string,
  name: string | null,
  url: string
): EmailMessage {
  return {
    to: toEmail,
    subject: "Confirm your email for Roofdrafts",
    text: `${name ? `Hi ${name},` : "Hi,"}\n\nConfirm this is your email address so we can send your roof reports and order updates here:\n${url}\n\nThis link is valid for 24 hours.`,
    html: shell(
      "Confirm your email",
      p(greet(name)) +
        p("Confirm this is your email address so we can deliver your roof reports and order updates here:") +
        btn(url, "Confirm email address") +
        p("This link is valid for 24 hours.") +
        fallback(url)
    ),
  };
}
