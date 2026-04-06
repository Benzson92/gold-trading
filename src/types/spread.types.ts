// ============================================================================
// spread.types.ts — The Pricing Breakdown Receipt (NEW in Part 3)
// ============================================================================
// Chef Analogy: When a restaurant charges ฿350 for a dish that costs
// ฿300 in ingredients, the SPREAD is ฿50. This type captures every
// number in that calculation chain so the customer (and auditors)
// can verify each step independently.
//
// Real-World Example:
//   Market sell price (base): ฿30,000 per baht-weight
//   Spread margin: 0.5%
//   Expected buy price: ฿30,000 × 1.005 = ฿30,150
//   Spread amount: ฿30,150 - ฿30,000 = ฿150
//   Customer quoted: ฿30,200
//   Deviation: |30,200 - 30,150| / 30,150 × 100 = 0.166%
// ============================================================================

export interface SpreadDetail {
  readonly marketSellPrice: number;
  readonly spreadMarginPercent: number;
  readonly expectedBuyPrice: number;
  readonly spreadAmount: number;
  readonly quotedPrice: number;
  readonly deviationPercent: number;
}
