
import BigNumber from "bignumber.js";

import { ValidatedOrder, ValidationError, ValidationErrorCode } from "../types";

export function validatePrice(
  order: ValidatedOrder,
): ValidationError | null {
  const bnPrice = new BigNumber(order.quoted_price);

  if (bnPrice.isLessThanOrEqualTo(0)) {
    return {
      field: "quoted_price",
      code: ValidationErrorCode.INVALID_PRICE,
      message: `Price must be positive. Received: ${bnPrice}`,
    };
  }

  return null;
}
