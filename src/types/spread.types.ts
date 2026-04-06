
export interface SpreadDetail {
  readonly marketSellPrice: number;
  readonly spreadMarginPercent: number;
  readonly expectedBuyPrice: number;
  readonly spreadAmount: number;
  readonly quotedPrice: number;
  readonly deviationPercent: number;
}
