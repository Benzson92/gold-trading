// ============================================================================
// validate-price.ts — Station 3: The Price Tag Inspector
// ============================================================================
// Chef Analogy: The cashier verifies the price on the ticket is positive
// and not some absurd number. A dish can't cost -฿50 or ฿0.
// ============================================================================

// --- External Libraries ---
import BigNumber from "bignumber.js";

// --- Internal Modules: Types ---
import { ValidatedOrder, ValidationError, ValidationErrorCode } from "../types";

// ---------------------------------------------------------------------------
// validatePrice — Ensure price is positive
// ---------------------------------------------------------------------------

export function validatePrice(
  order: ValidatedOrder,
): ValidationError | null {
  const bnPrice = new BigNumber(order.quoted_price);

  if (bnPrice.isLessThanOrEqualTo(0)) {
    return {
      field: "quoted_price",
      code: ValidationErrorCode.INVALID_PRICE,
      message: `Price must be positive. Received: ${bnPrice}`,
    };
  }

  return null;
}
