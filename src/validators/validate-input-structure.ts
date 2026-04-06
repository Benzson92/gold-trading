import { isNil, isString, isNumber, isFinite } from "lodash";

import {
  CreateOrderDto,
  ValidatedOrder,
  OrderType,
  ValidationError,
  ValidationErrorCode,
} from "../types";

import { CUSTOMER_ID_PATTERN } from "../constants";

export function validateInputStructure(
  orderData: CreateOrderDto,
): [ValidatedOrder | null, ValidationError[]] {
  const errors: ValidationError[] = [];
  const { customer_id, order_type, quantity, quoted_price } = orderData || {};

  // --- Check customer_id (accepts string or number) ---
  const normalizedCustomerId = isNumber(customer_id) ? String(customer_id) : customer_id;

  if (isNil(customer_id) || (!isString(customer_id) && !isNumber(customer_id))) {
    errors.push({
      field: "customer_id",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "customer_id is required and must be a string or number",
    });
  } else if (!CUSTOMER_ID_PATTERN.test(normalizedCustomerId)) {
    errors.push({
      field: "customer_id",
      code: ValidationErrorCode.INVALID_CUSTOMER_ID_FORMAT,
      message:
        "customer_id must be 1-50 alphanumeric characters, hyphens, or underscores",
    });
  }

  // --- Check order_type ---
  const validOrderTypes = Object.values(OrderType);

  if (isNil(order_type)) {
    errors.push({
      field: "order_type",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "order_type is required",
    });
  } else if (!validOrderTypes.includes(order_type)) {
    errors.push({
      field: "order_type",
      code: ValidationErrorCode.INVALID_TYPE,
      message: `order_type must be one of: ${validOrderTypes.join(", ")}`,
    });
  }

  // --- Check quantity ---
  if (isNil(quantity)) {
    errors.push({
      field: "quantity",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "quantity is required",
    });
  } else if (!isNumber(quantity) || !isFinite(quantity)) {
    errors.push({
      field: "quantity",
      code: ValidationErrorCode.INVALID_TYPE,
      message: "quantity must be a finite number",
    });
  }

  // --- Check quoted_price ---
  if (isNil(quoted_price)) {
    errors.push({
      field: "quoted_price",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "quoted_price is required",
    });
  } else if (!isNumber(quoted_price) || !isFinite(quoted_price)) {
    errors.push({
      field: "quoted_price",
      code: ValidationErrorCode.INVALID_TYPE,
      message: "quoted_price must be a finite number",
    });
  }

  if (errors.length > 0) {
    return [null, errors];
  }

  const validatedOrder: ValidatedOrder = {
    customer_id: String(customer_id),
    order_type: order_type!,
    quantity: quantity!,
    quoted_price: quoted_price!,
  };

  return [validatedOrder, []];
}
