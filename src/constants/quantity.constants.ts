// ============================================================================
// quantity.constants.ts — Portion Size Rules
// ============================================================================
// Chef Analogy: The laminated card above the prep station that says:
//   "Minimum portion: half plate. Maximum: 100 plates. Increments of 0.5."
//
// Real-World: Gold bars come in standard weights. You can't buy 0.3 of
// a standard bar. The minimum tradeable unit is 0.5 baht-weight, and
// all quantities must be multiples of that increment.
// ============================================================================

export const MIN_QUANTITY = 0.5;
export const MAX_QUANTITY = 100;
export const QUANTITY_INCREMENT = 0.5;
