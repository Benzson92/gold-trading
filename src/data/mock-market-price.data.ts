// ============================================================================
// mock-market-price.data.ts — The Fish Market Price Board
// ============================================================================
// Returns a fresh market price snapshot with the current timestamp.
//
// Domain Context:
//   sell_price: What the dealer pays to buy gold FROM you (base price)
//   buy_price: What you pay to buy gold FROM the dealer (base + spread)
//
// In production, these come from a real-time market data feed
// updated every few seconds via WebSocket or polling API.
// ============================================================================

// --- Internal Modules: Types ---
import { MarketPriceSnapshot } from "../types";

// ---------------------------------------------------------------------------
// getCurrentMarketPrice — Today's price board
// ---------------------------------------------------------------------------

export function getCurrentMarketPrice(): MarketPriceSnapshot {
  return {
    sell_price: 30_000,
    buy_price: 30_150,
    timestamp: new Date(),
  };
}
