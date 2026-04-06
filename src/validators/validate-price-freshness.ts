
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