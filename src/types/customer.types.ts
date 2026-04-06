// ============================================================================
// customer.types.ts — The Membership Card Format
// ============================================================================
// Chef Analogy: The customer's membership card shows their name, ID,
// and how much store credit (balance) they have available.
//
// For BUY orders: balance = available THB (Thai Baht) for purchasing
// For SELL orders: balance = available gold holdings (in baht-weight)
// ============================================================================

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly balance: number;
}
