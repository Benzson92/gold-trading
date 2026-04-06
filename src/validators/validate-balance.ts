
import BigNumber from "bignumber.js";

import {
  ValidatedOrder,
  OrderType,
  Customer,
  ValidationError,
  ValidationErrorCode,
} from "../types";

export function validateBalance(
  order: ValidatedOrder,
  customer: Customer,
): ValidationError | null {
  const bnQuantity = new BigNumber(order.quantity);
  const bnPrice = new BigNumber(order.quoted_price);
  const bnBalance = new BigNumber(customer.balance);

  if (order.order_type === OrderType.BUY) {
    const totalCost = bnQuantity.multipliedBy(bnPrice);

    if (totalCost.isGreaterThan(bnBalance)) {
      return {
        field: "balance",
        code: ValidationErrorCode.INSUFFICIENT_BALANCE,
        message:
          `Insufficient balance. ` +
          `Order total: ${totalCost} THB ` +
          `(${bnQuantity} × ${bnPrice}), ` +
          `available: ${bnBalance} THB`,
      };
    }
  }

  if (order.order_type === OrderType.SELL) {
    if (bnQuantity.isGreaterThan(bnBalance)) {
      return {
        field: "balance",
        code: ValidationErrorCode.INSUFFICIENT_BALANCE,
        message:
          `Insufficient gold holdings. ` +
          `Sell quantity: ${bnQuantity} baht-weight, ` +
          `available: ${bnBalance} baht-weight`,
      };
    }
  }

  return null;
}
