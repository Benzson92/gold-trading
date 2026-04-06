// ============================================================================
// validate-order.ts — The Head Chef's Pipeline (Part 3: Extended)
// ============================================================================
// Chef Analogy: The HEAD CHEF doesn't cook. The head chef ORCHESTRATES.
// They decide which stations an order visits, in what sequence, and
// whether the final plate meets quality standards.
//
//   ┌─────────────────────────────────────────────────────────────────┐
//   │  VALIDATION PIPELINE — 7 Stations                              │
//   │                                                                │
//   │  Station 1: Input Structure  → "Is this a valid order form?"   │
//   │  Station 2: Quantity         → "Is the amount legal?"          │
//   │  Station 3: Price            → "Is the price positive?"        │
//   │  Station 4: Balance          → "Can they afford this?"         │
//   │  Station 5: Price Freshness  → "Is the quote still current?"   │
//   │  Station 6: Spread Check ★   → "Is BUY price correctly marked  │
//   │                                 up?" (REPLACES #5 for BUY)     │
//   │  Station 7: Daily Limit ★    → "Has the customer hit their     │
//   │                                 daily cap?"                    │
//   │                                                                │
//   │  ★ = NEW in Part 3                                             │
//   └─────────────────────────────────────────────────────────────────┘
//
// DESIGN DECISIONS:
//   1. COLLECT ALL ERRORS — don't fail fast. Show every problem at once.
//   2. SPREAD REPLACES FRESHNESS for BUY — strictly stronger check.
//   3. DAILY LIMIT IS LAST — no point counting plates if order is invalid.
// ============================================================================

// --- External Libraries ---
import isPlainObject from "lodash/isPlainObject";
import compact from "lodash/compact";

// --- Internal Modules: Types ---
import {
  CreateOrderDto,
  // OrderType,
  MarketPriceSnapshot,
  // SpreadDetail,
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
} from "./types";

// --- Internal Modules: Validators ---
import {
  validateInputStructure,
  validateQuantity,
  validatePrice,
  validateBalance,
  validatePriceFreshness,
  // validateSpread,
  // validateDailyLimit,
} from "./validators";

// --- Internal Modules: Models ---
// import { DailyLimitTracker } from "./models";

// --- Internal Modules: Data ---
import { findCustomerById, getCurrentMarketPrice } from "./data";

// ---------------------------------------------------------------------------
// validateOrder — The Head Chef's Complete Pipeline
// ---------------------------------------------------------------------------

export function validateOrder(
  rawInput: unknown,
  // limitTracker: DailyLimitTracker,
): ValidationResult {
  // =========================================================================
  // FRONT DESK — Is this even an object?
  // =========================================================================

  if (!isPlainObject(rawInput)) {
    return {
      valid: false,
      errors: [
        {
          field: "order",
          code: ValidationErrorCode.INVALID_TYPE,
          message: "Order must be a plain object matching CreateOrderDto shape",
        },
      ],
    };
  }

  const dto = rawInput as CreateOrderDto;

  // =========================================================================
  // STATION 1: Input Structure
  // =========================================================================

  const [parsedOrder, structureErrors] = validateInputStructure(dto);

  if (parsedOrder === null) {
    return { valid: false, errors: structureErrors };
  }

  // =========================================================================
  // STATION 2: Quantity
  // =========================================================================

  const quantityError = validateQuantity(parsedOrder);

  // =========================================================================
  // STATION 3: Price
  // =========================================================================

  const priceError = validatePrice(parsedOrder);

  // =========================================================================
  // STATION 4: Balance
  // =========================================================================

  const customer = findCustomerById(parsedOrder.customer_id);
  let balanceError: ValidationError | null = null;

  if (!customer) {
    balanceError = {
      field: "customer_id",
      code: ValidationErrorCode.INVALID_TYPE,
      message: `Customer not found: ${parsedOrder.customer_id}`,
    };
  } else {
    balanceError = validateBalance(parsedOrder, customer);
  }

  // =========================================================================
  // STATION 5 / 6: Price Verification — Spread OR Freshness
  // =========================================================================
  // BUY  → Spread validation (verifies markup is correct)
  // SELL → Price freshness (verifies market data is current)
  // =========================================================================

  const marketPrice: MarketPriceSnapshot = getCurrentMarketPrice();
  let priceVerificationError: ValidationError | null = null;
  // let spreadDetail: SpreadDetail | undefined;

  // if (parsedOrder.order_type === OrderType.BUY) {
  //   const spreadResult = validateSpread(
  //     marketPrice.sell_price,
  //     parsedOrder.quoted_price,
  //   );

  //   priceVerificationError = spreadResult.error;
  //   spreadDetail = spreadResult.spread;
  // } else {
    priceVerificationError = validatePriceFreshness(parsedOrder, marketPrice);
  // }

  // =========================================================================
  // STATION 7: Daily Trading Limit
  // =========================================================================

  // const dailyLimitError = validateDailyLimit(
  //   parsedOrder.customer_id,
  //   parsedOrder.quantity,
  //   limitTracker,
  // );

  // =========================================================================
  // COLLECT ALL ERRORS
  // =========================================================================

  const allErrors: ValidationError[] = compact([
    quantityError,
    priceError,
    balanceError,
    priceVerificationError,
    // dailyLimitError,
  ]);

  // =========================================================================
  // BUILD RESULT
  // =========================================================================

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors };
  }

  return {
    valid: true,
    order: parsedOrder,
    // spread: spreadDetail,
  };
}
