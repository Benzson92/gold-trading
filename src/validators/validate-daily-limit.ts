// ============================================================================
// validate-daily-limit.ts — Station 7: The Plate Counter Check (Part 3)
// ============================================================================
// Chef Analogy: Before the waiter brings another plate, the host
// checks the clipboard:
//   1. How much has this customer ordered today? (sum of all records)
//   2. How much are they trying to order now? (new quantity)
//   3. Would that push them over the limit? (projected total > max)
//
// If over the limit, the error message includes:
//   - How many orders they've placed today
//   - Their current total
//   - The remaining allowance
//
// WHY A STANDALONE FUNCTION (not a class method on the tracker)?
//   Pure function pattern. The tracker holds STATE, but the VALIDATION
//   LOGIC is stateless — it just reads the tracker and returns a verdict.
//   This keeps the validator testable without instantiating the tracker.
// ============================================================================

// --- External Libraries ---
import BigNumber from "bignumber.js";

// --- Internal Modules: Types ---
import { ValidationError, ValidationErrorCode } from "../types";

// --- Internal Modules: Models ---
import { DailyLimitTracker } from "../models";

// --- Internal Modules: Constants ---
import { MAX_DAILY_QUANTITY_PER_CUSTOMER } from "../constants";

// ---------------------------------------------------------------------------
// validateDailyLimit — The host checks the clipboard before serving
// ---------------------------------------------------------------------------

export function validateDailyLimit(
  customerId: string,
  quantity: number,
  tracker: DailyLimitTracker,
): ValidationError | null {
  const bnQuantity = new BigNumber(quantity);
  const bnCurrentTotal = new BigNumber(tracker.getTodayTotal(customerId));
  const bnLimit = new BigNumber(MAX_DAILY_QUANTITY_PER_CUSTOMER);
  const bnProjectedTotal = bnCurrentTotal.plus(bnQuantity);

  if (bnProjectedTotal.isGreaterThan(bnLimit)) {
    const bnRemaining = BigNumber.maximum(bnLimit.minus(bnCurrentTotal), 0);
    const orderCount = tracker.getOrderHistory(customerId).length;

    return {
      field: "quantity",
      code: ValidationErrorCode.DAILY_LIMIT_EXCEEDED,
      message:
        `Daily trading limit exceeded. ` +
        `${orderCount} order(s) today totaling ${bnCurrentTotal} baht-weight, ` +
        `requested: ${bnQuantity} baht-weight, ` +
        `projected: ${bnProjectedTotal} baht-weight. ` +
        `Daily limit: ${bnLimit} baht-weight. ` +
        `Remaining allowance: ${bnRemaining} baht-weight`,
    };
  }

  return null;
}
