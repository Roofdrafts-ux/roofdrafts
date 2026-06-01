// Pure order state-machine — no server-only imports, fully unit-testable.
import type { OrderStatus } from "../generated/prisma/enums";

/** Forward transitions an estimator may take from each status. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["MODELING", "ON_HOLD", "CANCELLED"],
  MODELING: ["QA_REVIEW", "ON_HOLD"],
  QA_REVIEW: ["DELIVERED", "MODELING", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["MODELING"],
  ON_HOLD: ["MODELING", "CANCELLED"],
  DELIVERED: ["REVISION_REQUESTED"],
  CANCELLED: [],
};

export interface TransitionContext {
  hasModel: boolean;
  isMock: boolean;
}

export interface TransitionResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate an order status transition, enforcing the production invariants:
 *  - the move must be an allowed edge in the state machine
 *  - QA_REVIEW requires a saved roof model
 *  - DELIVERED is blocked when the model was traced over mock imagery
 */
export function validateTransition(
  from: OrderStatus,
  to: OrderStatus,
  ctx: TransitionContext
): TransitionResult {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    return { ok: false, error: `Cannot move from ${from} to ${to}.` };
  }
  if (to === "QA_REVIEW" && !ctx.hasModel) {
    return { ok: false, error: "Cannot send to QA: no roof model saved yet." };
  }
  if (to === "DELIVERED" && ctx.isMock) {
    return {
      ok: false,
      error: "Cannot deliver: roof model is flagged as mock (traced over mock imagery).",
    };
  }
  return { ok: true };
}
