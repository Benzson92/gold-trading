
import BigNumber from "bignumber.js";

import { ValidatedOrder, ValidationError, ValidationErrorCode } from "../types";
import { MIN_QUANTITY, MAX_QUANTITY, QUANTITY_INCREMENT } from "../constants";

export function validateQuantity(
  order: ValidatedOrder,
): ValidationError | null {
  const bnQuantity = new BigNumber(order.quantity);
  const bnMin = new BigNumber(MIN_QUANTITY);
  const bnMax = new BigNumber(MAX_QUANTITY);
  const bnIncrement = new BigNumber(QUANTITY_INCREMENT);

  if (bnQuantity.isLessThan(bnMin) || bnQuantity.isGreaterThan(bnMax)) {
    return {
      field: "quantity",
      code: ValidationErrorCode.INVALID_QUANTITY,
      message:
        `Quantity must be between ${bnMin} and ${bnMax} baht-weight. ` +
        `Received: ${bnQuantity}`,
    };
  }

  if (!bnQuantity.modulo(bnIncrement).isZero()) {
    return {
      field: "quantity",
      code: ValidationErrorCode.INVALID_QUANTITY,
      message:
        `Quantity must be a multiple of ${bnIncrement} baht-weight. ` +
        `Received: ${bnQuantity}`,
    };
  }

  return null;
}
