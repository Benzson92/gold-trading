// ============================================================================
// daily-limit.types.ts — The Clipboard Record Formats (NEW in Part 3)
// ============================================================================
// Chef Analogy: The buffet host's clipboard has TWO levels of detail:
//   1. DailyOrderRecord → One LINE per plate served (individual record)
//   2. DailyLimitSummary → The BOTTOM LINE of the page (aggregated view)
//
// WHY INDIVIDUAL RECORDS (not just a total)?
//   A running total of "4.5" can't answer "which orders got me here?"
//   A list of records can:
//     Order 1: BUY  2.0 baht-weight at 14:32
//     Order 2: BUY  1.5 baht-weight at 15:01
//     Order 3: BUY  1.0 baht-weight at 15:45
//     Total:   4.5 baht-weight ← computed, never stored separately
// ============================================================================

// --- Internal Modules: Types ---
import { OrderType } from "./order.types";

// ---------------------------------------------------------------------------
// DAILY ORDER RECORD — One individual order in the day's history
// ---------------------------------------------------------------------------
// Each LINE on the host's clipboard represents ONE plate served.
// "Table 5, Plate 1: BUY, 2 baht-weight, ฿30,150, at 14:32."
// ---------------------------------------------------------------------------

export interface DailyOrderRecord {
  readonly customerId: string;
  readonly orderType: OrderType;
  readonly quantity: number;
  readonly quotedPrice: number;
  readonly timestamp: Date;
}

// ---------------------------------------------------------------------------
// DAILY LIMIT SUMMARY — The bottom-line view of a customer's day
// ---------------------------------------------------------------------------
// The SUMMARY LINE at the bottom of the clipboard page.
// "Table 5: 3 orders, 4.5 total baht-weight, 0.5 remaining."
// Built by reading all the individual records above it.
// ---------------------------------------------------------------------------

export interface DailyLimitSummary {
  readonly customerId: string;
  readonly date: string;
  readonly orders: ReadonlyArray<DailyOrderRecord>;
  readonly totalQuantity: number;
  readonly remainingAllowance: number;
}
