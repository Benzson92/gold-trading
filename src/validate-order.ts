
import isPlainObject from "lodash/isPlainObject";
import compact from "lodash/compact";
import isEmpty from "lodash/isEmpty";

import {
  CreateOrderDto,
  MarketPriceSnapshot,
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
} from "./types";

import {
  validateInputStructure,
  validateCustomer,
  validateQuantity,
  validatePrice,
  validateBalance,
  validatePriceFreshness,
} from "./validators";

import { findCustomerById, getCurrentMarketPrice } from "./data";

export function validateOrder(
  rawInput: unknown,
): ValidationResult {

  if (!isPlainObject(rawInput)) {
    return {
      valid: false,
      errors: [
        {
          field: "order",
          code: ValidationErrorCode.INVALID_TYPE,
          message: "Order must be a plain object matching CreateOrderDto shape",
        },
      ],
    };
  }

  const orderData = rawInput as CreateOrderDto;

  const [parsedOrder, structureErrors] = validateInputStructure(orderData);

  if (isEmpty(parsedOrder)) {
    return { valid: false, errors: structureErrors };
  }

  const customer = findCustomerById(parsedOrder.customer_id);
  const customerError = validateCustomer(parsedOrder, customer);

  if (!isEmpty(customerError)) {
    return { valid: false, errors: [customerError] };
  }

  const quantityError = validateQuantity(parsedOrder);
  const priceError = validatePrice(parsedOrder);
  const balanceError = validateBalance(parsedOrder, customer!);

  const marketPrice: MarketPriceSnapshot = getCurrentMarketPrice();
  const priceVerificationError = validatePriceFreshness(parsedOrder, marketPrice);
 
  const allErrors: ValidationError[] = compact([
    quantityError,
    priceError,
    balanceError,
    priceVerificationError,
  ]);

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors };
  }

  return {
    valid: true,
    order: parsedOrder,
  };
}
