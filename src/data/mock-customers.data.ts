// ============================================================================
// mock-customers.data.ts — The Practice Guest List
// ============================================================================
// Each customer is designed to test a specific scenario:
//   C001: Rich customer (high balance) — most orders should pass
//   C002: Budget customer (low balance) — large orders should fail
//   C003: Gold holder (sells gold)     — sell-side balance checks
// ============================================================================

// --- Internal Modules: Types ---
import { Customer } from "../types";

// ---------------------------------------------------------------------------
// MOCK CUSTOMERS
// ---------------------------------------------------------------------------

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "C001",
    name: "Somchai Goldhand",
    balance: 1_000_000,
  },
  {
    id: "C002",
    name: "Napat Thinwallet",
    balance: 10_000,
  },
  {
    id: "C003",
    name: "Ploy Goldholder",
    balance: 50,
  },
];

// ---------------------------------------------------------------------------
// findCustomerById — The host checks the reservation book
// ---------------------------------------------------------------------------

export function findCustomerById(customerId: string): Customer | undefined {
  return MOCK_CUSTOMERS.find((customer) => customer.id === customerId);
}
