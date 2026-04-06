// ============================================================================
// daily-limit-tracker.model.ts — The Buffet Plate Counter (NEW in Part 3)
// ============================================================================
// Chef Analogy: At an all-you-can-eat buffet, the host keeps a clipboard
// with EVERY plate listed individually — not just a running count.
//
//   Customer C001 — April 5, 2026:
//     Plate 1: BUY  2.0 baht-weight at 14:32  ← individual record
//     Plate 2: BUY  1.5 baht-weight at 15:01  ← individual record
//     Plate 3: BUY  1.0 baht-weight at 15:45  ← individual record
//     ─────────────────────────────────────────
//     Total:   4.5 baht-weight (limit: 5.0)   ← computed from records
//
// DATA STRUCTURE: Map<string, DailyOrderRecord[]>
//   Key: "customerId:YYYY-MM-DD" (date-scoped per customer)
//   Value: Array of individual order records for that customer+date
//   The total is COMPUTED by summing the array, not stored separately.
//   This eliminates the risk of the total drifting out of sync with
//   the actual records — a single source of truth.
//
// WHY A CLASS?
//   The tracker has STATE (the order history). Classes are the natural
//   home for "data + methods that operate on that data." A plain function
//   would need a mutable closure variable, which is harder to test.
// ============================================================================

// --- External Libraries ---
import BigNumber from "bignumber.js";

// --- Internal Modules: Types ---
import { OrderType } from "../types";
import { DailyOrderRecord, DailyLimitSummary } from "../types";

// --- Internal Modules: Constants ---
import { MAX_DAILY_QUANTITY_PER_CUSTOMER } from "../constants";

// ---------------------------------------------------------------------------
// DailyLimitTracker — The clipboard with every plate listed
// ---------------------------------------------------------------------------

export class DailyLimitTracker {
  // KEY FORMAT: "customerId:YYYY-MM-DD"
  // VALUE: Array of individual order records
  //
  // Chef Analogy: Each page on the clipboard is labeled with the customer
  // name and today's date. Each LINE on that page is one plate served.
  // Tomorrow, we start a fresh page.
  private readonly history = new Map<string, DailyOrderRecord[]>();

  // --- Build the history key ---
  // Combines customer ID and today's date into a unique lookup key.
  // This ensures yesterday's orders don't bleed into today's checks.
  private buildKey(customerId: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `${customerId}:${today}`;
  }

  // -------------------------------------------------------------------------
  // getOrderHistory — "Show me every plate this customer has had today"
  // -------------------------------------------------------------------------
  // Returns the full list of individual order records for a customer today.
  // If they haven't traded today, returns an empty array.
  // -------------------------------------------------------------------------

  getOrderHistory(customerId: string): ReadonlyArray<DailyOrderRecord> {
    const key = this.buildKey(customerId);
    return this.history.get(key) ?? [];
  }

  // -------------------------------------------------------------------------
  // getTodayTotal — "How many plates total has this customer had?"
  // -------------------------------------------------------------------------
  // COMPUTED from the order history — not stored separately.
  // This means the total can never drift out of sync with the records.
  //
  // WHY BigNumber for the sum?
  //   Adding many small floating-point numbers accumulates drift.
  //   0.1 + 0.2 + 0.3 + 0.4 + 0.5 in JavaScript = 1.4999999999999998
  //   BigNumber ensures 0.1 + 0.2 + 0.3 + 0.4 + 0.5 = 1.5 exactly.
  // -------------------------------------------------------------------------

  getTodayTotal(customerId: string): number {
    const orders = this.getOrderHistory(customerId);

    if (orders.length === 0) {
      return 0;
    }

    const total = orders.reduce(
      (sum, order) => sum.plus(new BigNumber(order.quantity)),
      new BigNumber(0),
    );

    return total.toNumber();
  }

  // -------------------------------------------------------------------------
  // getRemainingAllowance — "How many more plates can they have?"
  // -------------------------------------------------------------------------

  getRemainingAllowance(customerId: string): number {
    const bnLimit = new BigNumber(MAX_DAILY_QUANTITY_PER_CUSTOMER);
    const bnCurrentTotal = new BigNumber(this.getTodayTotal(customerId));

    const remaining = bnLimit.minus(bnCurrentTotal);

    return BigNumber.maximum(remaining, 0).toNumber();
  }

  // -------------------------------------------------------------------------
  // getSummary — "Give me the full clipboard page for this customer"
  // -------------------------------------------------------------------------
  // Returns a complete summary: all individual records PLUS the computed
  // total and remaining allowance. The full picture at a glance.
  // -------------------------------------------------------------------------

  getSummary(customerId: string): DailyLimitSummary {
    return {
      customerId,
      date: new Date().toISOString().slice(0, 10),
      orders: this.getOrderHistory(customerId),
      totalQuantity: this.getTodayTotal(customerId),
      remainingAllowance: this.getRemainingAllowance(customerId),
    };
  }

  // -------------------------------------------------------------------------
  // recordOrder — "Write down another plate on the clipboard"
  // -------------------------------------------------------------------------
  // Called AFTER validation passes and the order is executed.
  // Appends an individual order record to the customer's history list.
  //
  // WHY SEPARATE FROM VALIDATION?
  //   Validation checks IF the order is allowed. Recording happens AFTER
  //   the order executes. If validation passes but execution fails (e.g.,
  //   payment timeout), we don't want to count it against the limit.
  // -------------------------------------------------------------------------

  recordOrder(
    customerId: string,
    orderType: OrderType,
    quantity: number,
    quotedPrice: number,
  ): DailyLimitSummary {
    const key = this.buildKey(customerId);
    const existingOrders = this.history.get(key) ?? [];

    const newRecord: DailyOrderRecord = {
      customerId,
      orderType,
      quantity,
      quotedPrice,
      timestamp: new Date(),
    };

    const updatedOrders = [...existingOrders, newRecord];
    this.history.set(key, updatedOrders);

    return this.getSummary(customerId);
  }

  // -------------------------------------------------------------------------
  // reset — "New day, fresh clipboard" (useful for testing)
  // -------------------------------------------------------------------------

  reset(): void {
    this.history.clear();
  }
}
