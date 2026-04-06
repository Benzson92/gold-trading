
import BigNumber from "bignumber.js";

import { ValidationError, ValidationErrorCode } from "../types";
import { DailyLimitTracker } from "../models";
import { MAX_DAILY_QUANTITY_PER_CUSTOMER } from "../constants";

export function validateDailyLimit(
  customerId: string,
  quantity: number,
  tracker: DailyLimitTracker,
): ValidationError | null {
  const bnQuantity = new BigNumber(quantity);
  const bnCurrentTotal = new BigNumber(tracker.getTodayTotal(customerId));
  const bnLimit = new BigNumber(MAX_DAILY_QUANTITY_PER_CUSTOMER);
  const bnProjectedTotal = bnCurrentTotal.plus(bnQuantity);

  if (bnProjectedTotal.isGreaterThan(bnLimit)) {
    const bnRemaining = BigNumber.maximum(bnLimit.minus(bnCurrentTotal), 0);
    const orderCount = tracker.getOrderHistory(customerId).length;

    return {
      field: "quantity",
      code: ValidationErrorCode.DAILY_LIMIT_EXCEEDED,
      message:
        `Daily trading limit exceeded. ` +
        `${orderCount} order(s) today totaling ${bnCurrentTotal} baht-weight, ` +
        `requested: ${bnQuantity} baht-weight, ` +
        `projected: ${bnProjectedTotal} baht-weight. ` +
        `Daily limit: ${bnLimit} baht-weight. ` +
        `Remaining allowance: ${bnRemaining} baht-weight`,
    };
  }

  return null;
}
