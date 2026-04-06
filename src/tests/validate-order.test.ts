
import { validateOrder } from "../validate-order";
import { OrderType, ValidationErrorCode } from "../types";

import * as dataModule from "../data";

jest.mock("../data", () => ({
  ...jest.requireActual("../data"),
  findCustomerById: jest.fn(),
  getCurrentMarketPrice: jest.fn(),
}));

const mockFindCustomer = dataModule.findCustomerById as jest.MockedFunction<
  typeof dataModule.findCustomerById
>;
const mockGetMarketPrice =
  dataModule.getCurrentMarketPrice as jest.MockedFunction<
    typeof dataModule.getCurrentMarketPrice
  >;

function validBuyOrder() {
  return {
    customer_id: "C001",
    order_type: OrderType.BUY,
    quantity: 1.0,
    quoted_price: 30_400,
  };
}

function validSellOrder() {
  return {
    customer_id: "C001",
    order_type: OrderType.SELL,
    quantity: 1.0,
    quoted_price: 30_300,
  };
}

beforeEach(() => {
  mockGetMarketPrice.mockReturnValue({
    buy_price: 30_400,
    sell_price: 30_300,
    timestamp: new Date(),
  });

  mockFindCustomer.mockImplementation((id: string) => {
    const customers: Record<
      string,
      { id: string; name: string; balance: number }
    > = {
      C001: { id: "C001", name: "Somchai Goldhand", balance: 1_000_000 },
      C002: { id: "C002", name: "Napat Thinwallet", balance: 10_000 },
      C003: { id: "C003", name: "Ploy Goldholder", balance: 50 },
      "12345": { id: "12345", name: "Numeric Niran", balance: 500_000 },
    };

    return customers[id];
  });
});

// GROUP 1: HAPPY PATHS 
describe("Happy Paths — Valid Orders", () => {
  test("accepts a valid buy order with exact market buy price", () => {
    const result = validateOrder(validBuyOrder());

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.order.customer_id).toBe("C001");
      expect(result.order.order_type).toBe(OrderType.BUY);
      expect(result.order.quantity).toBe(1.0);
      expect(result.order.quoted_price).toBe(30_400);
    }
  });

  test("accepts a valid sell order with exact market sell price", () => {
    const result = validateOrder(validSellOrder());

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.order.order_type).toBe(OrderType.SELL);
    }
  });

  test("accepts quantity of 0.5 (minimum valid increment)", () => {
    const order = { ...validBuyOrder(), quantity: 0.5 };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("accepts quantity of 2.5 (valid half-unit increment)", () => {
    const order = { ...validBuyOrder(), quantity: 2.5 };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("accepts large valid quantity when customer can afford it", () => {
    // C001 has 1,000,000 THB → can afford 10 × 30,400 = 304,000 THB
    const order = { ...validBuyOrder(), customer_id: "C001", quantity: 10.0 };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("accepts price within 2% tolerance (slightly above market)", () => {
    // 30,400 × 1.019 ≈ 30,978 — within 2% of 30,400
    const order = { ...validBuyOrder(), quantity: 0.5, quoted_price: 30_900 };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("accepts price within 2% tolerance (slightly below market)", () => {
    // 30,400 × 0.981 ≈ 29,822 — within 2% of 30,400
    const order = { ...validBuyOrder(), quantity: 0.5, quoted_price: 29_900 };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });
});

// GROUP 2: ORDER TYPE VALIDATION — "Only 'buy' or 'sell' allowed"
describe("Order Type Validation", () => {
  test("rejects invalid order_type 'trade'", () => {
    const order = { ...validBuyOrder(), order_type: "trade" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      // validateInputStructure uses INVALID_TYPE for unrecognized order_type
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_TYPE,
        }),
      );
    }
  });

  test("rejects empty string order_type", () => {
    const order = { ...validBuyOrder(), order_type: "" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
  });

  test("rejects numeric order_type", () => {
    const order = { ...validBuyOrder(), order_type: 1 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
  });

  test("rejects uppercase 'BUY' (case-sensitive)", () => {
    const order = { ...validBuyOrder(), order_type: "BUY" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_TYPE,
        }),
      );
    }
  });
});

// GROUP 3: QUANTITY VALIDATION
describe("Quantity Validation", () => {
  test("rejects negative quantity", () => {
    const order = { ...validBuyOrder(), quantity: -1.0 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_QUANTITY,
        }),
      );
    }
  });

  test("rejects zero quantity", () => {
    const order = { ...validBuyOrder(), quantity: 0 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_QUANTITY,
        }),
      );
    }
  });

  test("rejects quantity below minimum (0.3)", () => {
    const order = { ...validBuyOrder(), quantity: 0.3 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      // 0.3 < MIN_QUANTITY (0.5) → range error
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_QUANTITY,
        }),
      );
    }
  });

  test("rejects quantity of 1.7 (not a valid 0.5 increment)", () => {
    const order = { ...validBuyOrder(), quantity: 1.7 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_QUANTITY,
        }),
      );
    }
  });

  test("rejects quantity of 0.1 (below minimum)", () => {
    const order = { ...validBuyOrder(), quantity: 0.1 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
  });

  test("rejects string quantity at structure validation", () => {
    const order = { ...validBuyOrder(), quantity: "two" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "quantity",
          code: ValidationErrorCode.INVALID_TYPE,
        }),
      );
    }
  });

  test("rejects NaN quantity at structure validation", () => {
    const order = { ...validBuyOrder(), quantity: NaN };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "quantity",
          code: ValidationErrorCode.INVALID_TYPE,
        }),
      );
    }
  });

  test("rejects Infinity quantity at structure validation", () => {
    const order = { ...validBuyOrder(), quantity: Infinity };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "quantity",
          code: ValidationErrorCode.INVALID_TYPE,
        }),
      );
    }
  });

  test("rejects quantity exceeding MAX_QUANTITY (100 baht-weight)", () => {
    const order = { ...validBuyOrder(), quantity: 101 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_QUANTITY,
        }),
      );
    }
  });
});

// GROUP 4: PRICE VALIDATION 
describe("Price Validation", () => {
  test("rejects negative price", () => {
    const order = { ...validBuyOrder(), quoted_price: -100 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_PRICE,
        }),
      );
    }
  });

  test("rejects zero price", () => {
    const order = { ...validBuyOrder(), quoted_price: 0 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_PRICE,
        }),
      );
    }
  });

  test("rejects string price at structure validation", () => {
    const order = { ...validBuyOrder(), quoted_price: "30000" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "quoted_price",
          code: ValidationErrorCode.INVALID_TYPE,
        }),
      );
    }
  });
});

// GROUP 5: BALANCE VALIDATION — "Can the customer afford this?"
describe("Balance Validation", () => {
  test("rejects buy order when balance is insufficient", () => {
    // C002 has 10,000 THB, but 1 × 30,400 = 30,400 THB needed
    const order = { ...validBuyOrder(), customer_id: "C002" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INSUFFICIENT_BALANCE,
        }),
      );
    }
  });

  test("rejects buy order when balance is very low", () => {
    // C003 has 50 THB — nowhere near enough for 30,400
    const order = { ...validBuyOrder(), customer_id: "C003" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INSUFFICIENT_BALANCE,
        }),
      );
    }
  });

  test("returns INVALID_TYPE error for unknown customer", () => {
    const order = { ...validBuyOrder(), customer_id: "UNKNOWN" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: "customer_id",
          code: ValidationErrorCode.INVALID_TYPE,
          message: expect.stringContaining("Customer not found"),
        }),
      );
    }
  });

  test("sell order checks gold holdings, not THB balance", () => {
    // C003 has balance of 50 (gold holdings for sell).
    // Selling 1.0 when holding 50 → passes.
    const order = { ...validSellOrder(), customer_id: "C003", quantity: 1.0 };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("rejects sell order when gold holdings are insufficient", () => {
    mockFindCustomer.mockImplementation((id: string) => {
      if (id === "LOW_GOLD") {
        return { id: "LOW_GOLD", name: "Low Gold Holder", balance: 0.5 };
      }
      return undefined;
    });

    const order = {
      customer_id: "LOW_GOLD",
      order_type: OrderType.SELL,
      quantity: 1.0,
      quoted_price: 30_300,
    };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INSUFFICIENT_BALANCE,
        }),
      );
    }
  });
});

// GROUP 6: PRICE FRESHNESS — "Is the price still current?"
describe("Price Freshness Validation", () => {
  test("rejects price more than 2% above market buy price", () => {
    // 30,400 × 1.025 ≈ 31,160 — exceeds 2% threshold
    const order = { ...validBuyOrder(), quantity: 0.5, quoted_price: 31_200 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.PRICE_TOO_STALE,
        }),
      );
    }
  });

  test("rejects price more than 2% below market buy price", () => {
    // 30,400 × 0.97 = 29,488 — exceeds threshold
    const order = { ...validBuyOrder(), quantity: 0.5, quoted_price: 29_400 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
  });

  test("accepts price at exactly 2% boundary", () => {
    // 30,400 × 1.02 = 31,008 — exactly at the boundary
    const order = {
      ...validBuyOrder(),
      quantity: 0.5,
      quoted_price: 31_008,
    };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("sell order compares against sell_price, not buy_price", () => {
    const order = validSellOrder();
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("rejects drastically stale price (old menu scenario)", () => {
    // 25,000 vs market 30,400 — ~17.8% deviation
    const order = { ...validBuyOrder(), quantity: 0.5, quoted_price: 25_000 };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      const freshnessError = result.errors.find(
        (e) => e.code === ValidationErrorCode.PRICE_TOO_STALE,
      );
      expect(freshnessError).toBeDefined();
      expect(freshnessError!.message).toContain("deviates");
    }
  });
});

// GROUP 7: MISSING FIELDS — "The order ticket is incomplete"
describe("Missing Fields", () => {
  test("rejects order with no fields", () => {
    const result = validateOrder({});

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBe(4);
      expect(result.errors[0].code).toBe(ValidationErrorCode.MISSING_FIELD);
    }
  });

  test("rejects order missing quantity and quoted_price", () => {
    const result = validateOrder({
      customer_id: "C001",
      order_type: OrderType.BUY,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      const missingFields = result.errors.map((e) => e.field);
      expect(missingFields).toContain("quantity");
      expect(missingFields).toContain("quoted_price");
    }
  });

  test("rejects order with null values for required fields", () => {
    const result = validateOrder({
      customer_id: null,
      order_type: null,
      quantity: null,
      quoted_price: null,
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBe(4);
      result.errors.forEach((e) => {
        expect(e.code).toBe(ValidationErrorCode.MISSING_FIELD);
      });
    }
  });
});

// GROUP 8: SECURITY & EDGE CASES — "Can someone break the system?"
describe("Security & Edge Cases", () => {
  test("handles null input without crashing", () => {
    const result = validateOrder(null);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_TYPE);
    }
  });

  test("handles undefined input without crashing", () => {
    const result = validateOrder(undefined);

    expect(result.valid).toBe(false);
  });

  test("handles string input without crashing", () => {
    const result = validateOrder("not an order");

    expect(result.valid).toBe(false);
  });

  test("handles number input without crashing", () => {
    const result = validateOrder(42);

    expect(result.valid).toBe(false);
  });

  test("handles array input without crashing", () => {
    const result = validateOrder([1, 2, 3]);

    expect(result.valid).toBe(false);
  });

  test("accepts numeric customer_id at structure validation", () => {
    const order = { ...validBuyOrder(), customer_id: 12345 };
    const result = validateOrder(order);

    console.log('errors', result)
  
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.order.customer_id).toBe("12345");
    }
  });
  
  test("rejects customer_id with injection characters via regex", () => {
    const order = {
      ...validBuyOrder(),
      customer_id: "'; DROP TABLE orders;--",
    };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_CUSTOMER_ID_FORMAT,
        }),
      );
    }
  });

  test("rejects customer_id with XSS attempt via regex", () => {
    const order = {
      ...validBuyOrder(),
      customer_id: "<script>alert('xss')</script>",
    };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_CUSTOMER_ID_FORMAT,
        }),
      );
    }
  });

  test("rejects empty string customer_id via regex", () => {
    const order = { ...validBuyOrder(), customer_id: "" };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_CUSTOMER_ID_FORMAT,
        }),
      );
    }
  });

  test("accepts customer_id at max length (50 characters)", () => {
    const maxId = "A".repeat(50);
    mockFindCustomer.mockImplementation((id: string) => {
      if (id === maxId) {
        return { id: maxId, name: "Max Length ID", balance: 1_000_000 };
      }
      return undefined;
    });

    const order = { ...validBuyOrder(), customer_id: maxId };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("rejects customer_id exceeding max length (51 characters)", () => {
    const longId = "A".repeat(51);
    const order = { ...validBuyOrder(), customer_id: longId };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ValidationErrorCode.INVALID_CUSTOMER_ID_FORMAT,
        }),
      );
    }
  });

  test("collects multiple errors simultaneously", () => {
    const order = {
      customer_id: "C002",
      order_type: OrderType.BUY,
      quantity: 1.7, // Invalid increment
      quoted_price: 25_000, // Stale price
    };
    const result = validateOrder(order);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// GROUP 9: BOUNDARY VALUE TESTING — "Testing the exact edges"
describe("Boundary Values", () => {
  test("accepts exact balance match (cost = balance exactly)", () => {
    mockFindCustomer.mockImplementation((id: string) => {
      if (id === "BOUNDARY") {
        return { id: "BOUNDARY", name: "Boundary Tester", balance: 30_400 };
      }
      return undefined;
    });

    const order = {
      customer_id: "BOUNDARY",
      order_type: OrderType.BUY,
      quantity: 1.0,
      quoted_price: 30_400,
    };

    const result = validateOrder(order);
    expect(result.valid).toBe(true);
  });

  test("rejects when cost exceeds balance by just 1 THB", () => {
    mockFindCustomer.mockImplementation((id: string) => {
      if (id === "ALMOST") {
        return { id: "ALMOST", name: "Almost Enough", balance: 30_399 };
      }
      return undefined;
    });

    const order = {
      customer_id: "ALMOST",
      order_type: OrderType.BUY,
      quantity: 1.0,
      quoted_price: 30_400,
    };

    const result = validateOrder(order);
    expect(result.valid).toBe(false);
  });

  test("accepts minimum valid quantity (0.5)", () => {
    const order = { ...validBuyOrder(), quantity: 0.5 };
    const result = validateOrder(order);

    expect(result.valid).toBe(true);
  });

  test("accepts maximum valid quantity (100) when balance allows", () => {
    mockFindCustomer.mockImplementation((id: string) => {
      if (id === "WHALE") {
        return { id: "WHALE", name: "Whale Buyer", balance: 10_000_000 };
      }
      return undefined;
    });

    const order = {
      customer_id: "WHALE",
      order_type: OrderType.BUY,
      quantity: 100,
      quoted_price: 30_400,
    };

    const result = validateOrder(order);
    expect(result.valid).toBe(true);
  });

  test("accepts whole number quantities (1, 2, 3...)", () => {
    for (const qty of [1, 2, 3, 5, 10]) {
      const order = { ...validSellOrder(), quantity: qty };
      const result = validateOrder(order);

      expect(result.valid).toBe(true);
    }
  });

  test("accepts valid half-unit quantities (0.5, 1.5, 2.5...)", () => {
    for (const qty of [0.5, 1.5, 2.5, 5.5]) {
      const order = { ...validSellOrder(), quantity: qty };
      const result = validateOrder(order);

      expect(result.valid).toBe(true);
    }
  });
});
