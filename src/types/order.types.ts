// ============================================================================
// order.types.ts — The Kitchen Ticket Formats
// ============================================================================
// Chef Analogy: These define what an order looks like at each stage:
//   1. CreateOrderDto → The handwritten note from the customer (raw, untrusted)
//   2. ValidatedOrder → The printed kitchen ticket (verified, trusted)
//   3. OrderType      → BUY or SELL (ordering food vs returning a dish)
// ============================================================================

// ---------------------------------------------------------------------------
// ORDER TYPE — Buy or Sell
// ---------------------------------------------------------------------------
// A customer either ORDERS gold (BUY) or SELLS gold back (SELL).
// No third option. This enum enforces that binary choice.
// ---------------------------------------------------------------------------

export enum OrderType {
  BUY = "buy",
  SELL = "sell",
}

// ---------------------------------------------------------------------------
// THE RAW ORDER — What the customer hands to the front desk
// ---------------------------------------------------------------------------
// This is the handwritten note. It might have typos, missing fields,
// or nonsense — we validate LATER. The `readonly` modifier prevents
// accidental mutation during the validation pipeline.
// ---------------------------------------------------------------------------

export interface CreateOrderDto {
  readonly customer_id: string;
  readonly order_type: OrderType;
  readonly quantity: number;
  readonly quoted_price: number;
}

// ---------------------------------------------------------------------------
// THE VALIDATED ORDER — What leaves the validation pipeline
// ---------------------------------------------------------------------------
// The neat, printed kitchen ticket that every station trusts.
// If you're holding a ValidatedOrder, it means EVERY check has passed.
// ---------------------------------------------------------------------------

export interface ValidatedOrder {
  readonly customer_id: string;
  readonly order_type: OrderType;
  readonly quantity: number;
  readonly quoted_price: number;
}
