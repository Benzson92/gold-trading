
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

import BigNumber from "bignumber.js";

import { OrderType } from "../types";
import { DailyOrderRecord, DailyLimitSummary } from "../types";

import { MAX_DAILY_QUANTITY_PER_CUSTOMER } from "../constants";

export class DailyLimitTracker {
  // KEY FORMAT: "customerId:YYYY-MM-DD"
  // VALUE: Array of individual order records
  private readonly history = new Map<string, DailyOrderRecord[]>();

  // --- Build the history key ---
  private buildKey(customerId: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `${customerId}:${today}`;
  }

  // Returns the full list of individual order records for a customer today.
  // If they haven't traded today, returns an empty array.
  getOrderHistory(customerId: string): ReadonlyArray<DailyOrderRecord> {
    const key = this.buildKey(customerId);
    return this.history.get(key) ?? [];
  }

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

  getRemainingAllowance(customerId: string): number {
    const bnLimit = new BigNumber(MAX_DAILY_QUANTITY_PER_CUSTOMER);
    const bnCurrentTotal = new BigNumber(this.getTodayTotal(customerId));

    const remaining = bnLimit.minus(bnCurrentTotal);

    return BigNumber.maximum(remaining, 0).toNumber();
  }

  // Returns a complete summary: all individual records PLUS the computed
  // total and remaining allowance.
  getSummary(customerId: string): DailyLimitSummary {
    return {
      customerId,
      date: new Date().toISOString().slice(0, 10),
      orders: this.getOrderHistory(customerId),
      totalQuantity: this.getTodayTotal(customerId),
      remainingAllowance: this.getRemainingAllowance(customerId),
    };
  }

  // Called AFTER validation passes and the order is executed.
  // Appends an individual order record to the customer's history list.
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

  reset(): void {
    this.history.clear();
  }
}
