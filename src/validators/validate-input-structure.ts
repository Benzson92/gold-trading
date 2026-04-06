// ============================================================================
// validate-input-structure.ts — Station 1: The Front Desk Check-In
// ============================================================================
// Chef Analogy: Before anyone enters the kitchen, the front desk verifies
// the reservation form is complete. Missing name? Rejected. Phone number
// looks like "DROP TABLE"? Rejected. Everything present and clean? You
// get a validated ticket and proceed to the kitchen stations.
//
// This is the ONLY validator that returns a tuple:
//   [ValidatedOrder | null, ValidationError[]]
// Because structural problems can affect MULTIPLE fields, we collect
// ALL structural errors at once instead of failing on the first one.
//
// SECURITY: The customer_id is validated against a regex pattern to
// prevent injection attacks. Customer IDs flow into database queries
// and API calls — a malicious ID could be devastating.
// ============================================================================

// --- External Libraries ---
import isNil from "lodash/isNil";

// --- Internal Modules: Types ---
import {
  CreateOrderDto,
  ValidatedOrder,
  OrderType,
  ValidationError,
  ValidationErrorCode,
} from "../types";

// --- Internal Modules: Constants ---
import { CUSTOMER_ID_PATTERN } from "../constants";

// ---------------------------------------------------------------------------
// validateInputStructure — Check every field on the order form
// ---------------------------------------------------------------------------

export function validateInputStructure(
  dto: CreateOrderDto,
): [ValidatedOrder | null, ValidationError[]] {
  const errors: ValidationError[] = [];

  // --- Check customer_id ---
  if (isNil(dto.customer_id) || typeof dto.customer_id !== "string") {
    errors.push({
      field: "customer_id",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "customer_id is required and must be a string",
    });
  } else if (!CUSTOMER_ID_PATTERN.test(dto.customer_id)) {
    errors.push({
      field: "customer_id",
      code: ValidationErrorCode.INVALID_CUSTOMER_ID_FORMAT,
      message:
        "customer_id must be 1-50 alphanumeric characters, hyphens, or underscores",
    });
  }

  // --- Check order_type ---
  const validOrderTypes = Object.values(OrderType);

  if (isNil(dto.order_type)) {
    errors.push({
      field: "order_type",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "order_type is required",
    });
  } else if (!validOrderTypes.includes(dto.order_type)) {
    errors.push({
      field: "order_type",
      code: ValidationErrorCode.INVALID_TYPE,
      message: `order_type must be one of: ${validOrderTypes.join(", ")}`,
    });
  }

  // --- Check quantity ---
  if (isNil(dto.quantity)) {
    errors.push({
      field: "quantity",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "quantity is required",
    });
  } else if (typeof dto.quantity !== "number" || !isFinite(dto.quantity)) {
    errors.push({
      field: "quantity",
      code: ValidationErrorCode.INVALID_TYPE,
      message: "quantity must be a finite number",
    });
  }

  // --- Check quoted_price ---
  if (isNil(dto.quoted_price)) {
    errors.push({
      field: "quoted_price",
      code: ValidationErrorCode.MISSING_FIELD,
      message: "quoted_price is required",
    });
  } else if (typeof dto.quoted_price !== "number" || !isFinite(dto.quoted_price)) {
    errors.push({
      field: "quoted_price",
      code: ValidationErrorCode.INVALID_TYPE,
      message: "quoted_price must be a finite number",
    });
  }

  // --- Verdict ---
  if (errors.length > 0) {
    return [null, errors];
  }

  const validatedOrder: ValidatedOrder = {
    customer_id: dto.customer_id,
    order_type: dto.order_type,
    quantity: dto.quantity,
    quoted_price: dto.quoted_price,
  };

  return [validatedOrder, []];
}
