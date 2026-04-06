import isEmpty from "lodash/isEmpty";

import { ValidationError, ValidationErrorCode,ValidatedOrder,Customer } from "../types";

export function validateCustomer(
  parsedOrder: ValidatedOrder,
  customer: Customer | undefined
): ValidationError | null {
  if (isEmpty(customer)) {
    return {
      field: "customer_id",
      code: ValidationErrorCode.NOT_FOUND,
      message: `Customer not found: ${parsedOrder.customer_id}`,
    };
  }

  return null;
}