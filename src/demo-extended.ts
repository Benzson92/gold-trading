// ============================================================================
// demo.ts — The Soft Launch Night
// ============================================================================
// HOW TO RUN:  npx tsx demo.ts
// ============================================================================

// --- Internal Modules ---
import { OrderType } from "./types";
import { validateOrder } from "./validate-order-extended";
import { DailyLimitTracker } from "./models";
import {
  SPREAD_MARGIN_PERCENT,
  SPREAD_TOLERANCE_PERCENT,
  MAX_DAILY_QUANTITY_PER_CUSTOMER,
} from "./constants";

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------

function printHeader(title: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
}

function printScenario(
  label: string,
  input: unknown,
  result: ReturnType<typeof validateOrder>,
): void {
  console.log(`\n--- ${label} ---`);
  console.log("Input:", JSON.stringify(input, null, 2));

  if (result.valid) {
    console.log("Result: ✅ VALID");
    console.log("Order:", JSON.stringify(result.order, null, 2));

    if (result.spread) {
      console.log("Spread Breakdown:", JSON.stringify(result.spread, null, 2));
    }
  } else {
    console.log("Result: ❌ INVALID");
    result.errors.forEach((err, idx) => {
      console.log(`  Error ${idx + 1}: [${err.field}] ${err.code}`);
      console.log(`           ${err.message}`);
    });
  }
}

// ---------------------------------------------------------------------------
// SCENARIO GROUP A: Spread Calculation
// ---------------------------------------------------------------------------

function runSpreadScenarios(tracker: DailyLimitTracker): void {
  printHeader(
    `REQUIREMENT A: Spread Calculation` +
    `\n  Spread margin: ${SPREAD_MARGIN_PERCENT}% | ` +
    `Tolerance: ${SPREAD_TOLERANCE_PERCENT}%` +
    `\n  Market sell price: 30,000 THB | ` +
    `Expected buy price: 30,150 THB`,
  );

  const exactPriceOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 30_150,
  };

  printScenario(
    "A1: Exact buy price (30,150 = 30,000 × 1.005)",
    exactPriceOrder,
    validateOrder(exactPriceOrder, tracker),
  );

  const withinToleranceOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 30_300,
  };

  printScenario(
    "A2: Within tolerance (30,300 — 0.50% deviation)",
    withinToleranceOrder,
    validateOrder(withinToleranceOrder, tracker),
  );

  const overToleranceOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 35_000,
  };

  printScenario(
    "A3: Over tolerance (35,000 — ~16% deviation)",
    overToleranceOrder,
    validateOrder(overToleranceOrder, tracker),
  );

  const underQuoteOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 25_000,
  };

  printScenario(
    "A4: Under-quoted (25,000 — ~17% deviation)",
    underQuoteOrder,
    validateOrder(underQuoteOrder, tracker),
  );

  const sellOrder = {
    customer_id: "C003",
    order_type: OrderType.SELL,
    quantity: 1,
    quoted_price: 30_000,
  };

  printScenario(
    "A5: SELL order (uses price freshness, not spread)",
    sellOrder,
    validateOrder(sellOrder, tracker),
  );
}

// ---------------------------------------------------------------------------
// SCENARIO GROUP B: Daily Trading Limits
// ---------------------------------------------------------------------------

function runDailyLimitScenarios(): void {
  printHeader(
    `REQUIREMENT B: Daily Trading Limits` +
    `\n  Max daily quantity per customer: ` +
    `${MAX_DAILY_QUANTITY_PER_CUSTOMER} baht-weight`,
  );

  const tracker = new DailyLimitTracker();

  // B1: First order (2 of 5)
  const firstOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 2,
    quoted_price: 30_150,
  };

  const firstResult = validateOrder(firstOrder, tracker);
  printScenario("B1: First order today (2 of 5 limit)", firstOrder, firstResult);

  if (firstResult.valid) {
    tracker.recordOrder("C001", OrderType.BUY, 2, 30_150);
    console.log(`  📋 Recorded: C001 now at ${tracker.getTodayTotal("C001")} baht-weight today`);
  }

  // B2: Second order (2.5 more, total = 4.5)
  const secondOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 2.5,
    quoted_price: 30_150,
  };

  const secondResult = validateOrder(secondOrder, tracker);
  printScenario("B2: Second order (2.5 more, total=4.5)", secondOrder, secondResult);

  if (secondResult.valid) {
    tracker.recordOrder("C001", OrderType.BUY, 2.5, 30_150);
    console.log(`  📋 Recorded: C001 now at ${tracker.getTodayTotal("C001")} baht-weight today`);
  }

  // B3: Third order EXCEEDS limit (1 more → total 5.5)
  const thirdOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 30_150,
  };

  printScenario("B3: Third order (1 more, would exceed 5.0 limit)", thirdOrder, validateOrder(thirdOrder, tracker));
  console.log(`  📋 Remaining allowance: ${tracker.getRemainingAllowance("C001")} baht-weight`);

  // B4: Order at exact remaining (0.5)
  const exactLimitOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 0.5,
    quoted_price: 30_150,
  };

  const exactResult = validateOrder(exactLimitOrder, tracker);
  printScenario("B4: Order at exact remaining allowance (0.5)", exactLimitOrder, exactResult);

  if (exactResult.valid) {
    tracker.recordOrder("C001", OrderType.BUY, 0.5, 30_150);
    console.log(`  📋 Recorded: C001 now at ${tracker.getTodayTotal("C001")} baht-weight today (fully used)`);
  }

  // B5: Different customer is unaffected
  const differentCustomerOrder = {
    customer_id: "C003",
    order_type: OrderType.SELL,
    quantity: 2,
    quoted_price: 30_000,
  };

  printScenario(
    "B5: Different customer (C003 — not affected by C001's limit)",
    differentCustomerOrder,
    validateOrder(differentCustomerOrder, tracker),
  );
}

// ---------------------------------------------------------------------------
// SCENARIO GROUP C: Edge Cases
// ---------------------------------------------------------------------------

function runEdgeCaseScenarios(): void {
  printHeader("EDGE CASES & COMBINED SCENARIOS");
  const tracker = new DailyLimitTracker();

  const multiErrorOrder = {
    customer_id: "C002",
    order_type: OrderType.BUY,
    quantity: 0.3,
    quoted_price: 50_000,
  };

  printScenario(
    "C1: Multiple errors (bad quantity + wrong price + low balance)",
    multiErrorOrder,
    validateOrder(multiErrorOrder, tracker),
  );

  printScenario(
    "C2: Not an object (string input)",
    "not an order",
    validateOrder("not an order", tracker),
  );

  const incompleteOrder = { customer_id: "C001" };
  printScenario(
    "C3: Missing fields (only customer_id)",
    incompleteOrder,
    validateOrder(incompleteOrder, tracker),
  );

  const injectionOrder = {
    customer_id: "'; DROP TABLE orders;--",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 30_150,
  };

  printScenario(
    "C4: SQL injection attempt in customer_id",
    injectionOrder,
    validateOrder(injectionOrder, tracker),
  );

  const unknownCustomerOrder = {
    customer_id: "C999",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 30_150,
  };

  printScenario(
    "C5: Non-existent customer (C999)",
    unknownCustomerOrder,
    validateOrder(unknownCustomerOrder, tracker),
  );
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

function main(): void {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  GOLD TRADING ORDER VALIDATION — Part 3 Demo             ║");
  console.log("║  Spread Calculation + Daily Trading Limits               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const spreadTracker = new DailyLimitTracker();

  runSpreadScenarios(spreadTracker);
  runDailyLimitScenarios();
  runEdgeCaseScenarios();

  console.log("\n" + "=".repeat(70));
  console.log("  ✅ All scenarios executed. Review results above.");
  console.log("=".repeat(70));
}

main();
