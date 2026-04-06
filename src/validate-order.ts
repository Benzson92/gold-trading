
import isPlainObject from "lodash/isPlainObject";
import compact from "lodash/compact";
import isNil from "lodash/isNil";

import {
  CreateOrderDto,
  MarketPriceSnapshot,
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
} from "./types";

import {
  validateInputStructure,
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

  if (isNil(parsedOrder)) {
    return { valid: false, errors: structureErrors };
  }

  const quantityError = validateQuantity(parsedOrder);
  const priceError = validatePrice(parsedOrder);

  const customer = findCustomerById(parsedOrder.customer_id);
  let balanceError: ValidationError | null = null;

  if (!customer) {
    balanceError = {
      field: "customer_id",
      code: ValidationErrorCode.INVALID_TYPE,
      message: `Customer not found: ${parsedOrder.customer_id}`,
    };
  } else {
    balanceError = validateBalance(parsedOrder, customer);
  }

  const marketPrice: MarketPriceSnapshot = getCurrentMarketPrice();
  let priceVerificationError: ValidationError | null = null;
   priceVerificationError = validatePriceFreshness(parsedOrder, marketPrice);
 
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
