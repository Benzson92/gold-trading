// ============================================================================
// demo.ts — The Soft Launch Night (Run This File)
// ============================================================================
// Chef Analogy: Before a restaurant opens to the public, the staff runs
// a "soft launch" — friends and family come in, order from the full menu,
// and the kitchen handles real tickets end-to-end. This file IS that
// soft launch. It runs every scenario the validation pipeline should
// handle and prints the results in a clear, readable format.
//
// HOW TO RUN:
//   npx ts-node demo.ts
//
//   Or if you prefer tsx (faster, no separate tsconfig needed):
//   npx tsx demo.ts
// ============================================================================

// --- Internal Modules ---
import { OrderType } from "./types";
import { validateOrder } from "./validate-order";
// import { DailyLimitTracker } from "./daily-limit-tracker";
// import {
//   SPREAD_MARGIN_PERCENT,
//   SPREAD_TOLERANCE_PERCENT,
//   MAX_DAILY_QUANTITY_PER_CUSTOMER,
// } from "./constants";

// ---------------------------------------------------------------------------
// UTILITIES — Pretty printing helpers
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
// Tests the new spread validation for BUY orders.
//
// KEY FORMULA:
//   sell_price (base market) = 30,000
//   spread margin = 0.5%
//   expected buy price = 30,000 × 1.005 = 30,150
//   tolerance = 2% → acceptable range: 29,547 to 30,753
// ---------------------------------------------------------------------------

// function runSpreadScenarios(tracker: DailyLimitTracker): void {
//   printHeader(
//     `REQUIREMENT A: Spread Calculation` +
//     `\n  Spread margin: ${SPREAD_MARGIN_PERCENT}% | ` +
//     `Tolerance: ${SPREAD_TOLERANCE_PERCENT}%` +
//     `\n  Market sell price: 30,000 THB | ` +
//     `Expected buy price: 30,150 THB`,
//   );

//   // Scenario A1: BUY order with EXACT expected buy price
//   // Expected: VALID — price matches perfectly
//   const exactPriceOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 1,
//     quoted_price: 30_150,
//   };

//   printScenario(
//     "A1: Exact buy price (30,150 = 30,000 × 1.005)",
//     exactPriceOrder,
//     validateOrder(exactPriceOrder),
//   );

//   // Scenario A2: BUY order within 2% tolerance (slightly above)
//   // 30,300 is 0.50% above expected — well within 2%
//   // Expected: VALID
//   const withinToleranceOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 1,
//     quoted_price: 30_300,
//   };

//   printScenario(
//     "A2: Within tolerance (30,300 — 0.50% deviation)",
//     withinToleranceOrder,
//     validateOrder(withinToleranceOrder),
//   );

//   // Scenario A3: BUY order EXCEEDING 2% tolerance
//   // 35,000 is ~16% above expected — way too high
//   // Expected: INVALID — SPREAD_DEVIATION_TOO_HIGH
//   const overToleranceOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 1,
//     quoted_price: 35_000,
//   };

//   printScenario(
//     "A3: Over tolerance (35,000 — ~16% deviation)",
//     overToleranceOrder,
//     validateOrder(overToleranceOrder),
//   );

//   // Scenario A4: BUY order below expected (under-quoting)
//   // 25,000 is ~17% below expected — also invalid
//   // Expected: INVALID — SPREAD_DEVIATION_TOO_HIGH
//   const underQuoteOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 1,
//     quoted_price: 25_000,
//   };

//   printScenario(
//     "A4: Under-quoted (25,000 — ~17% deviation)",
//     underQuoteOrder,
//     validateOrder(underQuoteOrder),
//   );

//   // Scenario A5: SELL order uses freshness check, NOT spread
//   // Expected: VALID — sell orders bypass spread validation
//   const sellOrder = {
//     customer_id: "C003",
//     order_type: OrderType.SELL,
//     quantity: 1,
//     quoted_price: 30_000,
//   };

//   printScenario(
//     "A5: SELL order (uses price freshness, not spread)",
//     sellOrder,
//     validateOrder(sellOrder),
//   );
// }

// ---------------------------------------------------------------------------
// SCENARIO GROUP B: Daily Trading Limits
// ---------------------------------------------------------------------------
// Tests the daily limit enforcement.
//
// KEY RULE:
//   Each customer can trade max 5 baht-weight per day (across ALL orders).
//   If a new order would exceed this limit, it's rejected with a clear
//   message showing the remaining allowance.
// ---------------------------------------------------------------------------

// function runDailyLimitScenarios(): void {
//   printHeader(
//     `REQUIREMENT B: Daily Trading Limits` +
//     `\n  Max daily quantity per customer: ` +
//     `${MAX_DAILY_QUANTITY_PER_CUSTOMER} baht-weight`,
//   );

//   // Fresh tracker for this scenario group — isolated from Spread tests
//   const tracker = new DailyLimitTracker();

//   // Scenario B1: First order of the day (2 baht-weight)
//   // Expected: VALID — 2 out of 5 limit, plenty of room
//   const firstOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 2,
//     quoted_price: 30_150,
//   };

//   const firstResult = validateOrder(firstOrder);
//   printScenario("B1: First order today (2 of 5 limit)", firstOrder, firstResult);

//   // Record the order if valid (simulates post-execution recording)
//   if (firstResult.valid) {
//     tracker.recordOrder("C001", 2);
//     console.log(`  📋 Recorded: C001 now at ${tracker.getTodayTotal("C001")} baht-weight today`);
//   }

//   // Scenario B2: Second order (2.5 baht-weight, total becomes 4.5)
//   // Expected: VALID — 4.5 out of 5 limit, just under
//   const secondOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 2.5,
//     quoted_price: 30_150,
//   };

//   const secondResult = validateOrder(secondOrder);
//   printScenario("B2: Second order (2.5 more, total=4.5)", secondOrder, secondResult);

//   if (secondResult.valid) {
//     tracker.recordOrder("C001", 2.5);
//     console.log(`  📋 Recorded: C001 now at ${tracker.getTodayTotal("C001")} baht-weight today`);
//   }

//   // Scenario B3: Third order that EXCEEDS the limit (1 more → total 5.5)
//   // Expected: INVALID — Daily limit exceeded, remaining: 0.5
//   const thirdOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 1,
//     quoted_price: 30_150,
//   };

//   printScenario("B3: Third order (1 more, would exceed 5.0 limit)", thirdOrder, validateOrder(thirdOrder));
//   console.log(`  📋 Remaining allowance: ${tracker.getRemainingAllowance("C001")} baht-weight`);

//   // Scenario B4: Order exactly at the remaining limit (0.5)
//   // Expected: VALID — exactly hits the cap
//   const exactLimitOrder = {
//     customer_id: "C001",
//     order_type: OrderType.BUY,
//     quantity: 0.5,
//     quoted_price: 30_150,
//   };

//   const exactResult = validateOrder(exactLimitOrder);
//   printScenario("B4: Order at exact remaining allowance (0.5)", exactLimitOrder, exactResult);

//   if (exactResult.valid) {
//     tracker.recordOrder("C001", 0.5);
//     console.log(`  📋 Recorded: C001 now at ${tracker.getTodayTotal("C001")} baht-weight today (fully used)`);
//   }

//   // Scenario B5: Different customer is unaffected by C001's limit
//   // Expected: VALID — C003 has their own separate daily limit
//   const differentCustomerOrder = {
//     customer_id: "C003",
//     order_type: OrderType.SELL,
//     quantity: 2,
//     quoted_price: 30_000,
//   };

//   printScenario(
//     "B5: Different customer (C003 — not affected by C001's limit)",
//     differentCustomerOrder,
//     validateOrder(differentCustomerOrder),
//   );
// }

// ---------------------------------------------------------------------------
// SCENARIO GROUP C: Edge Cases & Combined Scenarios
// ---------------------------------------------------------------------------

function runEdgeCaseScenarios(): void {
  printHeader("EDGE CASES & COMBINED SCENARIOS");
  // const tracker = new DailyLimitTracker();

  // Scenario C1: Multiple errors at once
  // Invalid quantity + spread deviation + insufficient balance
  const multiErrorOrder = {
    customer_id: "C002",
    order_type: OrderType.BUY,
    quantity: 0.3,
    quoted_price: 50_000,
  };

  printScenario(
    "C1: Multiple errors (bad quantity + wrong price + low balance customer)",
    multiErrorOrder,
    validateOrder(multiErrorOrder),
  );

  // Scenario C2: Completely invalid input (not even an object)
  printScenario(
    "C2: Not an object (string input)",
    "not an order",
    validateOrder("not an order"),
  );

  // Scenario C3: Missing fields
  const incompleteOrder = { customer_id: "C001" };
  printScenario(
    "C3: Missing fields (only customer_id)",
    incompleteOrder,
    validateOrder(incompleteOrder),
  );

  // Scenario C4: Injection attempt in customer_id
  const injectionOrder = {
    customer_id: "'; DROP TABLE orders;--",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 30_150,
  };

  printScenario(
    "C4: SQL injection attempt in customer_id",
    injectionOrder,
    validateOrder(injectionOrder),
  );

  // Scenario C5: Non-existent customer
  const unknownCustomerOrder = {
    customer_id: "C999",
    order_type: OrderType.BUY,
    quantity: 1,
    quoted_price: 30_150,
  };

  printScenario(
    "C5: Non-existent customer (C999)",
    unknownCustomerOrder,
    validateOrder(unknownCustomerOrder),
  );
}

// ---------------------------------------------------------------------------
// MAIN — Run all scenario groups
// ---------------------------------------------------------------------------

function main(): void {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  GOLD TRADING ORDER VALIDATION — Part 3 Demo             ║");
  console.log("║  Spread Calculation + Daily Trading Limits               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Shared tracker for spread scenarios (to show limit accumulation)
  // const spreadTracker = new DailyLimitTracker();

  // runSpreadScenarios(spreadTracker);
  // runDailyLimitScenarios();
  runEdgeCaseScenarios();

  console.log("\n" + "=".repeat(70));
  console.log("  ✅ All scenarios executed. Review results above.");
  console.log("=".repeat(70));
}

main();
