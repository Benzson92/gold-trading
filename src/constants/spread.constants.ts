// ============================================================================
// spread.constants.ts — The Restaurant's Markup Rules (NEW in Part 3)
// ============================================================================
// Chef Analogy: A restaurant buys salmon at ฿800/kg (market price) and
// sells the dish at ฿804/kg equivalent (0.5% markup). The TOLERANCE is
// how far off the customer's quoted price can be from the expected
// buy price — up to 2% deviation is acceptable.
//
// Real-World Example:
//   Market sell price: ฿30,000
//   Spread margin: 0.5% → Expected buy price: ฿30,150
//   Tolerance: 2% of ฿30,150 = ฿603
//   Acceptable range: ฿29,547 to ฿30,753
// ============================================================================

export const SPREAD_MARGIN_PERCENT = 0.5;
export const SPREAD_TOLERANCE_PERCENT = 2.0;
