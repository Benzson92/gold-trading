// ============================================================================
// types/index.ts — The Type System's Table of Contents
// ============================================================================
// BARREL EXPORT PATTERN:
//   Consumers import from "src/types" without knowing the internal layout.
//
//   import { OrderType, CreateOrderDto, ValidationResult } from "../types";
//
//   If we split or merge internal files, no import paths break.
// ============================================================================

export {
  OrderType,
  CreateOrderDto,
  ValidatedOrder,
} from "./order.types";

export {
  Customer,
} from "./customer.types";

export {
  MarketPriceSnapshot,
} from "./market.types";

export {
  SpreadDetail,
} from "./spread.types";

export {
  DailyOrderRecord,
  DailyLimitSummary,
} from "./daily-limit.types";

export {
  ValidationErrorCode,
  ValidationError,
  ValidationResult,
} from "./validation.types";
