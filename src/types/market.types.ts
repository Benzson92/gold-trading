// ============================================================================
// market.types.ts — The Fish Market Price Board
// ============================================================================
// Chef Analogy: The daily price board at the fish market. Prices change
// throughout the day, so every snapshot includes a timestamp showing
// WHEN these prices were valid. A snapshot from 5 minutes ago might
// already be stale — that's why we track the timestamp.
//
// Domain Context:
//   sell_price → What the dealer pays to buy gold FROM you (base price)
//   buy_price  → What you pay to buy gold FROM the dealer (base + spread)
// ============================================================================

export interface MarketPriceSnapshot {
  readonly buy_price: number;
  readonly sell_price: number;
  readonly timestamp: Date;
}
