
import isPlainObject from "lodash/isPlainObject";
import compact from "lodash/compact";
import isNil from "lodash/isNil";

import {
  CreateOrderDto,
  OrderType,
  MarketPriceSnapshot,
  SpreadDetail,
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
  validateSpread,
  validateDailyLimit,
} from "./validators";

import { DailyLimitTracker } from "./models";
import { findCustomerById, getCurrentMarketPrice } from "./data";

export function validateOrder(
  rawInput: unknown,
  limitTracker: DailyLimitTracker,
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
  let spreadDetail: SpreadDetail | undefined;

  if (parsedOrder.order_type === OrderType.BUY) {
    const spreadResult = validateSpread(
      marketPrice.sell_price,
      parsedOrder.quoted_price,
    );

    priceVerificationError = spreadResult.error;
    spreadDetail = spreadResult.spread;
  } else {
    priceVerificationError = validatePriceFreshness(parsedOrder, marketPrice);
  }

  const dailyLimitError = validateDailyLimit(
    parsedOrder.customer_id,
    parsedOrder.quantity,
    limitTracker,
  );

  const allErrors: ValidationError[] = compact([
    quantityError,
    priceError,
    balanceError,
    priceVerificationError,
    dailyLimitError,
  ]);

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors };
  }

  return {
    valid: true,
    order: parsedOrder,
    spread: spreadDetail,
  };
}
