
import BigNumber from "bignumber.js";

import {
  SpreadDetail,
  ValidationError,
  ValidationErrorCode,
} from "../types";

import {
  SPREAD_MARGIN_PERCENT,
  SPREAD_TOLERANCE_PERCENT,
} from "../constants";

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
