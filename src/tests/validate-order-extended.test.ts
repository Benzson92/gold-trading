// ============================================================================
// validate-order.test.ts — Quality Assurance Spot Checks
// ============================================================================
// HOW TO RUN:  npx jest validate-order.test.ts
// ============================================================================

// --- Internal Modules ---
import { OrderType } from "../types";
import { validateOrder } from "../validate-order-extended";
import { DailyLimitTracker } from "../models";
import { calculateSpread, validateSpread } from "../validators";
import {
  SPREAD_MARGIN_PERCENT,
  MAX_DAILY_QUANTITY_PER_CUSTOMER,
} from "../constants";
import { validateDailyLimit } from "../validators";

// ============================================================================
// REQUIREMENT A: Spread Calculation
// ============================================================================

describe("Spread Calculation", () => {
  describe("calculateSpread", () => {
    it("computes correct expected buy price with 0.5% margin", () => {
      const spread = calculateSpread(30_000, 30_150);

      expect(spread.expectedBuyPrice).toBe(30_150);
      expect(spread.spreadAmount).toBe(150);
      expect(spread.deviationPercent).toBe(0);
    });

    it("computes deviation when quoted price differs from expected", () => {
      const spread = calculateSpread(30_000, 30_300);

      expect(spread.expectedBuyPrice).toBe(30_150);
      expect(spread.deviationPercent).toBeCloseTo(0.4975, 4);
    });

    it("handles deviation in both directions (over and under)", () => {
      const overQuote = calculateSpread(30_000, 35_000);
      const underQuote = calculateSpread(30_000, 25_000);

      expect(overQuote.deviationPercent).toBeGreaterThan(0);
      expect(underQuote.deviationPercent).toBeGreaterThan(0);
    });

    it("preserves all fields for audit trail", () => {
      const spread = calculateSpread(30_000, 30_150);

      expect(spread).toEqual({
        marketSellPrice: 30_000,
        spreadMarginPercent: SPREAD_MARGIN_PERCENT,
        expectedBuyPrice: 30_150,
        spreadAmount: 150,
        quotedPrice: 30_150,
        deviationPercent: 0,
      });
    });
  });

  describe("validateSpread", () => {
    it("approves price at exact expected buy price", () => {
      const { error } = validateSpread(30_000, 30_150);
      expect(error).toBeNull();
    });

    it("approves price within 2% tolerance", () => {
      const { error } = validateSpread(30_000, 30_300);
      expect(error).toBeNull();
    });

    it("approves price at exactly 2% tolerance boundary", () => {
      const { error } = validateSpread(30_000, 30_753);
      expect(error).toBeNull();
    });

    it("rejects price exceeding 2% tolerance", () => {
      const { error } = validateSpread(30_000, 35_000);

      expect(error).not.toBeNull();
      expect(error!.code).toBe("SPREAD_DEVIATION_TOO_HIGH");
      expect(error!.field).toBe("quoted_price");
    });

    it("rejects price far below expected (under-quoting)", () => {
      const { error } = validateSpread(30_000, 25_000);

      expect(error).not.toBeNull();
      expect(error!.code).toBe("SPREAD_DEVIATION_TOO_HIGH");
    });

    it("always returns spread detail regardless of pass/fail", () => {
      const passing = validateSpread(30_000, 30_150);
      const failing = validateSpread(30_000, 50_000);

      expect(passing.spread).toBeDefined();
      expect(failing.spread).toBeDefined();
      expect(passing.spread.expectedBuyPrice).toBe(30_150);
      expect(failing.spread.expectedBuyPrice).toBe(30_150);
    });
  });

  describe("spread in validateOrder pipeline", () => {
    it("includes spread detail in valid BUY order result", () => {
      const tracker = new DailyLimitTracker();
      const result = validateOrder(
        {
          customer_id: "C001",
          order_type: OrderType.BUY,
          quantity: 1,
          quoted_price: 30_150,
        },
        tracker,
      );

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.spread).toBeDefined();
        expect(result.spread!.spreadAmount).toBe(150);
      }
    });

    it("does NOT include spread detail in valid SELL order result", () => {
      const tracker = new DailyLimitTracker();
      const result = validateOrder(
        {
          customer_id: "C003",
          order_type: OrderType.SELL,
          quantity: 1,
          quoted_price: 30_000,
        },
        tracker,
      );

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.spread).toBeUndefined();
      }
    });

    it("uses spread check (not freshness) for BUY orders", () => {
      const tracker = new DailyLimitTracker();
      const result = validateOrder(
        {
          customer_id: "C001",
          order_type: OrderType.BUY,
          quantity: 1,
          quoted_price: 50_000,
        },
        tracker,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) {
        const spreadError = result.errors.find(
          (e) => e.code === "SPREAD_DEVIATION_TOO_HIGH",
        );
        expect(spreadError).toBeDefined();

        const freshnessError = result.errors.find(
          (e) => e.code === "PRICE_TOO_STALE",
        );
        expect(freshnessError).toBeUndefined();
      }
    });
  });
});

// ============================================================================
// REQUIREMENT B: Daily Trading Limits
// ============================================================================

describe("Daily Trading Limits", () => {
  describe("DailyLimitTracker", () => {
    it("starts with zero for unknown customers", () => {
      const tracker = new DailyLimitTracker();
      expect(tracker.getTodayTotal("C001")).toBe(0);
    });

    it("starts with empty order history for unknown customers", () => {
      const tracker = new DailyLimitTracker();
      expect(tracker.getOrderHistory("C001")).toEqual([]);
    });

    it("accumulates orders for the same customer", () => {
      const tracker = new DailyLimitTracker();

      tracker.recordOrder("C001", OrderType.BUY, 2, 30_150);
      expect(tracker.getTodayTotal("C001")).toBe(2);

      tracker.recordOrder("C001", OrderType.BUY, 1.5, 30_150);
      expect(tracker.getTodayTotal("C001")).toBe(3.5);
    });

    it("stores individual order records in the history", () => {
      const tracker = new DailyLimitTracker();

      tracker.recordOrder("C001", OrderType.BUY, 2, 30_150);
      tracker.recordOrder("C001", OrderType.SELL, 1, 30_000);

      const history = tracker.getOrderHistory("C001");

      expect(history).toHaveLength(2);
      expect(history[0].quantity).toBe(2);
      expect(history[0].orderType).toBe(OrderType.BUY);
      expect(history[1].quantity).toBe(1);
      expect(history[1].orderType).toBe(OrderType.SELL);
    });

    it("tracks customers independently", () => {
      const tracker = new DailyLimitTracker();

      tracker.recordOrder("C001", OrderType.BUY, 3, 30_150);
      tracker.recordOrder("C002", OrderType.BUY, 1, 30_150);

      expect(tracker.getTodayTotal("C001")).toBe(3);
      expect(tracker.getTodayTotal("C002")).toBe(1);
      expect(tracker.getOrderHistory("C001")).toHaveLength(1);
      expect(tracker.getOrderHistory("C002")).toHaveLength(1);
    });

    it("calculates remaining allowance correctly", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 3.5, 30_150);

      expect(tracker.getRemainingAllowance("C001")).toBe(1.5);
    });

    it("clamps remaining allowance to zero (never negative)", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, MAX_DAILY_QUANTITY_PER_CUSTOMER, 30_150);

      expect(tracker.getRemainingAllowance("C001")).toBe(0);
    });

    it("resets all tracking data", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 3, 30_150);
      tracker.reset();

      expect(tracker.getTodayTotal("C001")).toBe(0);
      expect(tracker.getOrderHistory("C001")).toEqual([]);
    });

    it("returns DailyLimitSummary with complete shape from recordOrder", () => {
      const tracker = new DailyLimitTracker();
      const summary = tracker.recordOrder("C001", OrderType.BUY, 2, 30_150);

      expect(summary.customerId).toBe("C001");
      expect(summary.totalQuantity).toBe(2);
      expect(summary.remainingAllowance).toBe(3);
      expect(summary.orders).toHaveLength(1);
      expect(summary.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns updated summary after each recorded order", () => {
      const tracker = new DailyLimitTracker();

      const first = tracker.recordOrder("C001", OrderType.BUY, 2, 30_150);
      expect(first.orders).toHaveLength(1);
      expect(first.totalQuantity).toBe(2);
      expect(first.remainingAllowance).toBe(3);

      const second = tracker.recordOrder("C001", OrderType.BUY, 1.5, 30_150);
      expect(second.orders).toHaveLength(2);
      expect(second.totalQuantity).toBe(3.5);
      expect(second.remainingAllowance).toBe(1.5);
    });

    it("records timestamp on each order", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 1, 30_150);

      const history = tracker.getOrderHistory("C001");
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe("validateDailyLimit", () => {
    it("approves order within daily limit", () => {
      const tracker = new DailyLimitTracker();
      const error = validateDailyLimit("C001", 2, tracker);

      expect(error).toBeNull();
    });

    it("approves order that exactly reaches the limit", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 4.5, 30_150);

      const error = validateDailyLimit("C001", 0.5, tracker);
      expect(error).toBeNull();
    });

    it("rejects order that would exceed the limit", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 4.5, 30_150);

      const error = validateDailyLimit("C001", 1, tracker);

      expect(error).not.toBeNull();
      expect(error!.code).toBe("DAILY_LIMIT_EXCEEDED");
      expect(error!.field).toBe("quantity");
    });

    it("includes remaining allowance in error message", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 4, 30_150);

      const error = validateDailyLimit("C001", 2, tracker);

      expect(error).not.toBeNull();
      expect(error!.message).toContain("Remaining allowance: 1");
    });

    it("includes order count in error message", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 2, 30_150);
      tracker.recordOrder("C001", OrderType.BUY, 1.5, 30_150);
      tracker.recordOrder("C001", OrderType.SELL, 1, 30_000);

      const error = validateDailyLimit("C001", 2, tracker);

      expect(error).not.toBeNull();
      expect(error!.message).toContain("3 order(s) today");
    });

    it("rejects when customer is already at the limit", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, MAX_DAILY_QUANTITY_PER_CUSTOMER, 30_150);

      const error = validateDailyLimit("C001", 0.5, tracker);

      expect(error).not.toBeNull();
      expect(error!.message).toContain("Remaining allowance: 0");
    });
  });

  describe("daily limits in validateOrder pipeline", () => {
    it("enforces daily limit across multiple orders", () => {
      const tracker = new DailyLimitTracker();

      const first = validateOrder(
        {
          customer_id: "C001",
          order_type: OrderType.BUY,
          quantity: 4.5,
          quoted_price: 30_150,
        },
        tracker,
      );
      expect(first.valid).toBe(true);
      tracker.recordOrder("C001", OrderType.BUY, 4.5, 30_150);

      const second = validateOrder(
        {
          customer_id: "C001",
          order_type: OrderType.BUY,
          quantity: 1,
          quoted_price: 30_150,
        },
        tracker,
      );
      expect(second.valid).toBe(false);
      if (!second.valid) {
        expect(second.errors.some((e) => e.code === "DAILY_LIMIT_EXCEEDED")).toBe(true);
      }
    });

    it("does not cross-contaminate between customers", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, MAX_DAILY_QUANTITY_PER_CUSTOMER, 30_150);

      const result = validateOrder(
        {
          customer_id: "C003",
          order_type: OrderType.SELL,
          quantity: 2,
          quoted_price: 30_000,
        },
        tracker,
      );

      expect(result.valid).toBe(true);
    });

    it("combines daily limit error with other errors", () => {
      const tracker = new DailyLimitTracker();
      tracker.recordOrder("C001", OrderType.BUY, 4.5, 30_150);

      const result = validateOrder(
        {
          customer_id: "C001",
          order_type: OrderType.BUY,
          quantity: 0.3,
          quoted_price: 50_000,
        },
        tracker,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
