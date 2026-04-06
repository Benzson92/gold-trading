
import { OrderType } from "./order.types";

export interface DailyOrderRecord {
  readonly customerId: string;
  readonly orderType: OrderType;
  readonly quantity: number;
  readonly quotedPrice: number;
  readonly timestamp: Date;
}

export interface DailyLimitSummary {
  readonly customerId: string;
  readonly date: string;
  readonly orders: ReadonlyArray<DailyOrderRecord>;
  readonly totalQuantity: number;
  readonly remainingAllowance: number;
}
