import BigNumber from "bignumber.js";

/** Orders with a quoted price deviating more than 2% from market are rejected */
export const MAX_PRICE_DEVIATION_PERCENT = new BigNumber(2);