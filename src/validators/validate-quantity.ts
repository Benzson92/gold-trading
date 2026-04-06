// ============================================================================
// validate-quantity.ts — Station 2: The Portion Size Inspector
// ============================================================================
// Chef Analogy: The portion inspector checks every dish leaving the line:
//   "Is this at least half a plate?" (minimum 0.5 baht-weight)
//   "Is this more than 100 plates?" (maximum 100 baht-weight)
//   "Is this a clean half-plate increment?" (multiples of 0.5)
// ============================================================================

// --- External Libraries ---
import BigNumber from "bignumber.js";

// --- Internal Modules: Types ---
import { ValidatedOrder, ValidationError, ValidationErrorCode } from "../types";

// --- Internal Modules: Constants ---
import { MIN_QUANTITY, MAX_QUANTITY, QUANTITY_INCREMENT } from "../constants";

// ---------------------------------------------------------------------------
// validateQuantity — Check range and increment
// ---------------------------------------------------------------------------

export function validateQuantity(
  order: ValidatedOrder,
): ValidationError | null {
  const bnQuantity = new BigNumber(order.quantity);
  const bnMin = new BigNumber(MIN_QUANTITY);
  const bnMax = new BigNumber(MAX_QUANTITY);
  const bnIncrement = new BigNumber(QUANTITY_INCREMENT);

  if (bnQuantity.isLessThan(bnMin) || bnQuantity.isGreaterThan(bnMax)) {
    return {
      field: "quantity",
      code: ValidationErrorCode.INVALID_QUANTITY,
      message:
        `Quantity must be between ${bnMin} and ${bnMax} baht-weight. ` +
        `Received: ${bnQuantity}`,
    };
  }

  if (!bnQuantity.modulo(bnIncrement).isZero()) {
    return {
      field: "quantity",
      code: ValidationErrorCode.INVALID_QUANTITY,
      message:
        `Quantity must be a multiple of ${bnIncrement} baht-weight. ` +
        `Received: ${bnQuantity}`,
    };
  }

  return null;
}
