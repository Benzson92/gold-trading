// ============================================================================
// constants/index.ts — The Rule Book's Table of Contents
// ============================================================================
// Chef Analogy: Instead of flipping through five different laminated
// cards on the wall, the head chef has ONE master rule book with tabs.
// Open to "Quantity" → portion rules. Open to "Spread" → markup rules.
//
// BARREL EXPORT PATTERN:
//   Consumers import from "src/constants" — they don't need to know
//   which specific file holds which constant. If we reorganize the
//   internal files, imports don't break.
//
//   import { MIN_QUANTITY, SPREAD_MARGIN_PERCENT } from "../constants";
// ============================================================================

export {
  MIN_QUANTITY,
  MAX_QUANTITY,
  QUANTITY_INCREMENT,
} from "./quantity.constants";

export {
  MAX_PRICE_DEVIATION_PERCENT,
} from "./price.constants";

export {
  SPREAD_MARGIN_PERCENT,
  SPREAD_TOLERANCE_PERCENT,
} from "./spread.constants";

export {
  MAX_DAILY_QUANTITY_PER_CUSTOMER,
} from "./daily-limit.constants";

export {
  CUSTOMER_ID_PATTERN,
} from "./security.constants";
