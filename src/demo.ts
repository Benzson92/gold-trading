
import { OrderType } from "./types";
import { validateOrder } from "./validate-order";

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

// SCENARIO GROUP A: Happy Path — Valid Orders
function runHappyPathScenarios(): void {
  printHeader("GROUP A: HAPPY PATH — Valid Orders");

  // Scenario A1: Perfect Buy Order (should PASS)
  // "A regular customer orders 1.5 baht-weight at the current buy price."
  const buyOrder = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1.5,
    quoted_price: 30_400,
  };

  printScenario("A1: Valid Buy Order (1.5 baht-weight @ 30,400)", buyOrder, validateOrder(buyOrder));

  // Scenario A2: Perfect Sell Order (should PASS)
  // "A customer sells 2.0 baht-weight at the current sell price."
  const sellOrder = {
    customer_id: "C001",
    order_type: OrderType.SELL,
    quantity: 2.0,
    quoted_price: 30_300,
  };

  printScenario("A2: Valid Sell Order (2.0 baht-weight @ 30,300)", sellOrder, validateOrder(sellOrder));
}

// SCENARIO GROUP B: Business Rule Violations
function runBusinessRuleScenarios(): void {
  printHeader("GROUP B: BUSINESS RULE VIOLATIONS");

  // Scenario B1: Insufficient Balance (should FAIL)
  // "A customer with 10,000 THB tries to buy 1 baht-weight at 30,400 THB."
  // That's 30,400 THB needed but only 10,000 available — denied!
  const insufficientBalance = {
    customer_id: "C003",
    order_type: OrderType.BUY,
    quantity: 1.0,
    quoted_price: 30_400,
  };

  printScenario(
    "B1: Insufficient Balance (needs 30,400, has 10,000)",
    insufficientBalance,
    validateOrder(insufficientBalance),
  );

  // Scenario B2: Invalid Quantity Increment (should FAIL)
  // "0.3 baht-weight is not a valid trading unit (must be multiples of 0.5)."
  const invalidQuantity = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 0.3,
    quoted_price: 30_400,
  };

  printScenario(
    "B2: Invalid Quantity (0.3 — not a multiple of 0.5)",
    invalidQuantity,
    validateOrder(invalidQuantity),
  );

  // Scenario B3: Stale Price (should FAIL)
  // "The customer quoted 25,000 THB but market price is 30,400 THB."
  // That's ~17.8% deviation — way beyond the 2% threshold.
  const stalePrice = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1.0,
    quoted_price: 25_000,
  };

  printScenario(
    "B3: Stale Quoted Price (25,000 vs market 30,400 — ~17.8% off)",
    stalePrice,
    validateOrder(stalePrice),
  );

  // Scenario B4: Zero Balance Customer Tries to Buy (should FAIL)
  const zeroBalance = {
    customer_id: "C004",
    order_type: OrderType.BUY,
    quantity: 0.5,
    quoted_price: 30_400,
  };

  printScenario(
    "B4: Zero Balance Buy Attempt (C004 has 0 THB)",
    zeroBalance,
    validateOrder(zeroBalance),
  );

  // Scenario B5: Negative Values (should FAIL)
  // "Negative quantity and negative price — both invalid."
  const negativeValues = {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: -2.0,
    quoted_price: -30_400,
  };

  printScenario(
    "B5: Negative Values (qty: -2.0, price: -30,400)",
    negativeValues,
    validateOrder(negativeValues),
  );
}

// SCENARIO GROUP C: Edge Cases & Bad Input
function runEdgeCaseScenarios(): void {
  printHeader("GROUP C: EDGE CASES & BAD INPUT");

  // Scenario C1: Missing Fields (should FAIL)
  // "Someone sent an incomplete order — no quantity, no price."
  const missingFields = {
    customer_id: "C001",
    order_type: OrderType.BUY,
  };

  printScenario(
    "C1: Missing Fields (no quantity, no price)",
    missingFields,
    validateOrder(missingFields),
  );

  // Scenario C2: Completely Invalid Input (should FAIL gracefully)
  // "Someone sent a string instead of an order object."
  // Our validator should NEVER crash — it handles any input type.
  printScenario(
    "C2: Non-Object Input (string instead of order)",
    "this is not an order",
    validateOrder("this is not an order"),
  );

  // Scenario C3: Injection Attempt (should FAIL safely)
  // "Someone tries SQL injection through the customer_id field."
  const injectionAttempt = {
    customer_id: "'; DROP TABLE customers;--",
    order_type: OrderType.BUY,
    quantity: 1.0,
    quoted_price: 30_400,
  };

  printScenario(
    "C3: SQL Injection Attempt in customer_id",
    injectionAttempt,
    validateOrder(injectionAttempt),
  );
}

// MAIN — Run all scenario groups
function main(): void {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  GOLD TRADING ORDER VALIDATION — Soft Launch Demo        ║");
  console.log("║  10 Scenarios across 3 Groups                           ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  runHappyPathScenarios();
  runBusinessRuleScenarios();
  runEdgeCaseScenarios();

  console.log("\n" + "=".repeat(70));
  console.log("  ✅ All scenarios executed. Review results above.");
  console.log("=".repeat(70));
}

main();
