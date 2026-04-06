// ============================================================================
// validate-spread.ts — Station 6: The Pricing Station (NEW in Part 3)
// ============================================================================
// Chef Analogy: The HEAD CHEF sets menu prices using a formula:
//   ingredient cost + markup = menu price
//
// This station calculates the markup (spread) and verifies that the
// price on the customer's order matches the menu (within tolerance).
//
// FLOW:
//   1. Take the base market price (ingredient cost)
//   2. Add the spread margin (restaurant's markup %)
//   3. Calculate the expected buy price (menu price)
//   4. Compare customer's quoted price against expected
//   5. Within tolerance → approved
//   6. Exceeds tolerance → rejected with details
//
// WHY BigNumber?
//   Financial math demands exact decimal arithmetic.
//   0.1 + 0.2 = 0.30000000000000004 in JavaScript.
//   In gold trading, that tiny error could mean a valid order rejected
//   or an invalid order approved. BigNumber eliminates this entirely.
// ============================================================================

// --- External Libraries ---
import BigNumber from "bignumber.js";

// --- Internal Modules: Types ---
import {
  SpreadDetail,
  ValidationError,
  ValidationErrorCode,
} from "../types";

// --- Internal Modules: Constants ---
import {
  SPREAD_MARGIN_PERCENT,
  SPREAD_TOLERANCE_PERCENT,
} from "../constants";

// ---------------------------------------------------------------------------
// calculateSpread — Compute the full spread breakdown
// ---------------------------------------------------------------------------
// INPUT:
//   - marketSellPrice: The base market price (ingredient cost)
//   - quotedPrice: What the customer is willing to pay
//
// OUTPUT:
//   A SpreadDetail with every number in the calculation chain,
//   so auditors can verify each step independently.
//
// REAL-WORLD EXAMPLE:
//   marketSellPrice = 30,000 THB
//   spreadMargin = 0.5%
//   expectedBuyPrice = 30,000 × 1.005 = 30,150
//   spreadAmount = 150
//   quotedPrice = 30,200
//   deviation = |30,200 - 30,150| / 30,150 × 100 = 0.166%
// ---------------------------------------------------------------------------

export function calculateSpread(
  marketSellPrice: number,
  quotedPrice: number,
): SpreadDetail {
  const bnMarketSellPrice = new BigNumber(marketSellPrice);
  const bnQuotedPrice = new BigNumber(quotedPrice);
  const bnSpreadMargin = new BigNumber(SPREAD_MARGIN_PERCENT).dividedBy(100);

  // expected buy price = market × (1 + margin)
  const bnExpectedBuyPrice = bnMarketSellPrice.multipliedBy(
    new BigNumber(1).plus(bnSpreadMargin),
  );

  // spread amount = expected buy price - market sell price
  const bnSpreadAmount = bnExpectedBuyPrice.minus(bnMarketSellPrice);

  // deviation = |quoted - expected| / expected × 100
  const bnDeviation = bnQuotedPrice
    .minus(bnExpectedBuyPrice)
    .absoluteValue()
    .dividedBy(bnExpectedBuyPrice)
    .multipliedBy(100);

  return {
    marketSellPrice: bnMarketSellPrice.toNumber(),
    spreadMarginPercent: SPREAD_MARGIN_PERCENT,
    expectedBuyPrice: bnExpectedBuyPrice.toNumber(),
    spreadAmount: bnSpreadAmount.toNumber(),
    quotedPrice: bnQuotedPrice.toNumber(),
    deviationPercent: bnDeviation.decimalPlaces(4).toNumber(),
  };
}

// ---------------------------------------------------------------------------
// validateSpread — Check if the quoted buy price is within tolerance
// ---------------------------------------------------------------------------
// Chef Analogy: The floor manager checks whether the price on the
// customer's order matches the current menu. Small rounding differences
// are fine (within 2%), but ฿50 for a ฿500 lobster gets flagged.
//
// WHY THIS REPLACES PRICE FRESHNESS FOR BUY ORDERS:
//   The spread check is STRICTLY stronger. If the quoted price includes
//   the correct markup over the CURRENT market price, it implicitly
//   proves the price is fresh enough. Running both would be redundant.
// ---------------------------------------------------------------------------

export function validateSpread(
  marketSellPrice: number,
  quotedPrice: number,
): { error: ValidationError | null; spread: SpreadDetail } {
  const spread = calculateSpread(marketSellPrice, quotedPrice);

  const isWithinTolerance = new BigNumber(spread.deviationPercent)
    .isLessThanOrEqualTo(SPREAD_TOLERANCE_PERCENT);

  if (isWithinTolerance) {
    return { error: null, spread };
  }

  return {
    error: {
      field: "quoted_price",
      code: ValidationErrorCode.SPREAD_DEVIATION_TOO_HIGH,
      message:
        `Buy price deviates ${spread.deviationPercent}% from expected. ` +
        `Market sell price: ${spread.marketSellPrice} THB, ` +
        `expected buy price: ${spread.expectedBuyPrice} THB ` +
        `(${SPREAD_MARGIN_PERCENT}% spread), ` +
        `quoted: ${spread.quotedPrice} THB. ` +
        `Max allowed deviation: ${SPREAD_TOLERANCE_PERCENT}%`,
    },
    spread,
  };
}
