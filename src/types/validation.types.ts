
import { ValidatedOrder } from "./order.types";
import { SpreadDetail } from "./spread.types";

export enum ValidationErrorCode {
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_TYPE = "INVALID_TYPE",
  NOT_FOUND = "NOT_FOUND",

  INVALID_QUANTITY = "INVALID_QUANTITY",
  INVALID_PRICE = "INVALID_PRICE",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  PRICE_TOO_STALE = "PRICE_TOO_STALE",

  SPREAD_DEVIATION_TOO_HIGH = "SPREAD_DEVIATION_TOO_HIGH",
  DAILY_LIMIT_EXCEEDED = "DAILY_LIMIT_EXCEEDED",

  INVALID_CUSTOMER_ID_FORMAT = "INVALID_CUSTOMER_ID_FORMAT",
}

export interface ValidationError {
  readonly field: string;
  readonly code: ValidationErrorCode;
  readonly message: string;
}

export type ValidationResult =
  | {
      readonly valid: true;
      readonly order: ValidatedOrder;
      readonly spread?: SpreadDetail;
    }
  | {
      readonly valid: false;
      readonly errors: ValidationError[];
    };
