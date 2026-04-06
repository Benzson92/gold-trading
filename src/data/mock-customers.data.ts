
import { Customer } from "../types";

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
  {
    id: "12345",
    name: "Numeric Niran",
    balance: 500_000,
  },
];

export function findCustomerById(customerId: string): Customer | undefined {
  return MOCK_CUSTOMERS.find((customer) => customer.id === customerId);
}
