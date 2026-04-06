
export enum OrderType {
  BUY = "buy",
  SELL = "sell",
}

export interface CreateOrderDto {
  readonly customer_id: string | number;
  readonly order_type: OrderType;
  readonly quantity: number;
  readonly quoted_price: number;
}

export interface ValidatedOrder {
  readonly customer_id: string;
  readonly order_type: OrderType;
  readonly quantity: number;
  readonly quoted_price: number;
}
