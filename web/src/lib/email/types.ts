export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when the message was logged to console instead of actually sent (no API key). */
  dryRun?: boolean;
}

export interface Emailer {
  send(msg: EmailMessage): Promise<SendResult>;
}

/** Order lifecycle events that trigger a customer email. */
export type OrderEmailEvent =
  | "received"
  | "in_production"
  | "delivered"
  | "revision_requested"
  | "payment_received";
