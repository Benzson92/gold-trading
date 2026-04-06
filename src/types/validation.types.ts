// ============================================================================
// validation.types.ts — The Quality Inspector's Report Formats
// ============================================================================
// Chef Analogy: The quality inspector uses standardized forms:
//   - ValidationErrorCode → The CATEGORY of problem (burnt, undercooked...)
//   - ValidationError     → The full REJECTION SLIP (which station, what code, details)
//   - ValidationResult    → The FINAL STAMP (✅ FIRE or ❌ 86'd)
//
// DISCRIMINATED UNION (ValidationResult):
//   TypeScript's killer feature for results. If you check `valid === true`,
//   TypeScript KNOWS `order` exists. If `valid === false`, TypeScript KNOWS
//   `errors` exists. No guessing, no undefined access, no runtime surprises.
// ============================================================================

// --- Internal Modules: Types ---
import { ValidatedOrder } from "./order.types";
import { SpreadDetail } from "./spread.types";

// ---------------------------------------------------------------------------
// VALIDATION ERROR CODE — What category of problem was found?
// ---------------------------------------------------------------------------

export enum ValidationErrorCode {
  // --- Structure errors (front desk) ---
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_TYPE = "INVALID_TYPE",

  // --- Business rule errors (kitchen stations) ---
  INVALID_QUANTITY = "INVALID_QUANTITY",
  INVALID_PRICE = "INVALID_PRICE",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  PRICE_TOO_STALE = "PRICE_TOO_STALE",

  // --- Part 3 errors (new stations) ---
  SPREAD_DEVIATION_TOO_HIGH = "SPREAD_DEVIATION_TOO_HIGH",
  DAILY_LIMIT_EXCEEDED = "DAILY_LIMIT_EXCEEDED",

  // --- Security errors ---
  INVALID_CUSTOMER_ID_FORMAT = "INVALID_CUSTOMER_ID_FORMAT",
}

// ---------------------------------------------------------------------------
// VALIDATION ERROR — The rejection slip from a station
// ---------------------------------------------------------------------------
// Tells you WHICH station found the problem (field), WHAT category
// of problem (code), and a human-readable explanation (message).
// ---------------------------------------------------------------------------

export interface ValidationError {
  readonly field: string;
  readonly code: ValidationErrorCode;
  readonly message: string;
}

// ---------------------------------------------------------------------------
// VALIDATION RESULT — The final verdict (discriminated union)
// ---------------------------------------------------------------------------
// The kitchen manager stamps every ticket either:
//   ✅ "FIRE" (valid: true)  → includes the validated order + spread (if BUY)
//   ❌ "86'd" (valid: false) → includes ALL errors found across all stations
// ---------------------------------------------------------------------------

export type ValidationResult =
  | {
      readonly valid: true;
      readonly order: ValidatedOrder;
      readonly spread?: SpreadDetail;
    }
  | {
      readonly valid: false;
      readonly errors: ValidationError[];
    };
