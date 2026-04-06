// ============================================================================
// validate-price-freshness.ts — Station 5: The Price Freshness Check
// ============================================================================
// Chef Analogy: You ordered wagyu at $150/kg from the supplier's catalog.
// By the time your purchase order reaches them, the price shifted to $160/kg.
// If the gap is too large (>2%), the kitchen rejects the order — you don't
// want to commit to a price that no longer reflects reality.
//
// The market has two prices — buy_price (what the dealer sells to you) and
// sell_price (what the dealer buys from you). We compare the quoted price
// against whichever side the order is on.
// ============================================================================

import {
  ValidatedOrder,
  MarketPriceSnapshot,
  ValidationError,
  ValidationErrorCode,
  OrderType,
} from "../types";
import { MAX_PRICE_DEVIATION_PERCENT } from "../constants";

import BigNumber from "bignumber.js";

export function validatePriceFreshness(
  order: ValidatedOrder,
  marketPrice: MarketPriceSnapshot,
): ValidationError | null {
  const quoted = new BigNumber(order.quoted_price);

  // Pick the relevant market price based on order type:
  // BUY → dealer's buy_price (what the customer pays)
  // SELL → dealer's sell_price (what the customer receives)
  const relevantPrice =
    order.order_type === OrderType.BUY
      ? new BigNumber(marketPrice.buy_price)
      : new BigNumber(marketPrice.sell_price);

  const deviationPercent = quoted
    .minus(relevantPrice)
    .abs()
    .dividedBy(relevantPrice)
    .multipliedBy(100);

  if (deviationPercent.isGreaterThan(MAX_PRICE_DEVIATION_PERCENT)) {
    return {
      field: "quoted_price",
      code: ValidationErrorCode.PRICE_TOO_STALE,
      message:
        `Quoted price (${quoted.toFixed(2)}) deviates ${deviationPercent.toFixed(2)}% ` +
        `from current ${order.order_type.toLowerCase()} price (${relevantPrice.toFixed(2)}). ` +
        `Maximum allowed deviation: ${MAX_PRICE_DEVIATION_PERCENT.toFixed(0)}%. ` +
        `Please refresh your quote and retry`,
    };
  }

  return null;
}