import "server-only";
import { prisma } from "./prisma";

/**
 * Owner-editable business configuration. Values resolve in priority order:
 *   1. DB row (set via the admin Settings page)
 *   2. env fallback (for values bootstrapped before the UI existed)
 *   3. hard-coded default
 * SECRETS DO NOT BELONG HERE — keep API keys / connection strings in env only.
 */
export type SettingType = "string" | "emails" | "url" | "boolean";

export interface SettingDef {
  key: string;
  label: string;
  description: string;
  type: SettingType;
  group: string;
  envFallback?: string;
  default: string;
  placeholder?: string;
}

export const SETTINGS: SettingDef[] = [
  {
    key: "lead_alert_emails",
    label: "Lead-alert recipients",
    description: "Comma-separated inboxes notified when a company signs up.",
    type: "emails",
    group: "Notifications",
    envFallback: "LEAD_ALERT_EMAILS",
    default: "",
    placeholder: "sales@roofdrafts.com, you@example.com",
  },
  {
    key: "chat_alert_emails",
    label: "Chat-alert recipients",
    description:
      "Comma-separated inboxes notified when a visitor starts a live-chat conversation. Falls back to the lead-alert recipients when empty.",
    type: "emails",
    group: "Notifications",
    envFallback: "CHAT_ALERT_EMAILS",
    default: "",
    placeholder: "support@roofdrafts.com",
  },
  {
    key: "order_emails_enabled",
    label: "Order lifecycle emails",
    description: "Email customers on order received / in-production / delivered.",
    type: "boolean",
    group: "Notifications",
    default: "true",
  },
  {
    key: "company_volume_discount_pct",
    label: "Company volume discount (%)",
    description: "Percentage discount applied to company invoices (0–100). Leave 0 for none.",
    type: "string",
    group: "Billing",
    default: "0",
    placeholder: "10",
  },
  {
    key: "invoice_net_days",
    label: "Invoice net terms (days)",
    description: "Days until a company invoice is due after it's sent.",
    type: "string",
    group: "Billing",
    default: "15",
    placeholder: "15",
  },
  {
    key: "booking_url",
    label: "Sales booking link",
    description: "Optional scheduling link shown to high-volume company leads right after signup. Delivered server-side, only to that signed-in lead — never exposed in the public site.",
    type: "url",
    group: "Sales",
    default: "",
    placeholder: "https://calendly.com/your-team/intro",
  },
];

const BY_KEY: Record<string, SettingDef> = Object.fromEntries(SETTINGS.map((s) => [s.key, s]));

function resolve(def: SettingDef, dbValue?: string | null): string {
  if (dbValue != null && dbValue !== "") return dbValue;
  if (def.envFallback && process.env[def.envFallback]) return process.env[def.envFallback] as string;
  if (def.key === "lead_alert_emails" && process.env.BOOTSTRAP_ADMIN_EMAILS) {
    return process.env.BOOTSTRAP_ADMIN_EMAILS;
  }
  return def.default;
}

/** Resolve a single setting (DB → env → default). Unknown keys return "". */
export async function getSetting(key: string): Promise<string> {
  const def = BY_KEY[key];
  if (!def) return "";
  const row = await prisma.setting.findUnique({ where: { key } });
  return resolve(def, row?.value);
}

export async function getBool(key: string): Promise<boolean> {
  return (await getSetting(key)) === "true";
}

/** Parse an "emails" setting into a clean address list. */
export async function getEmails(key: string): Promise<string[]> {
  return (await getSetting(key))
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Resolve every registered setting in one query (for the admin UI). */
export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const dbMap: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out: Record<string, string> = {};
  for (const def of SETTINGS) out[def.key] = resolve(def, dbMap[def.key]);
  return out;
}

/** Upsert a setting value (validated against the registry by the caller). */
export async function setSetting(key: string, value: string, updatedById?: string | null): Promise<void> {
  if (!BY_KEY[key]) throw new Error(`Unknown setting: ${key}`);
  await prisma.setting.upsert({
    where: { key },
    create: { key, value, updatedById: updatedById ?? null },
    update: { value, updatedById: updatedById ?? null },
  });
}
