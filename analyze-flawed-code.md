
# Part 1: Analyze Flawed Code


## Original Flawed Code

```python
import sqlite3

def process_gold_order(customer_id, order_type, quantity, price):
    conn = sqlite3.connect("trading.db")
    cursor = conn.execute(
        "SELECT balance, name FROM customers WHERE id = " + str(customer_id)
    )
    customer = cursor.fetchone()
    balance = customer[0]
    name = customer[1]

    if order_type == "buy":
        total_cost = quantity * price
        if balance >= total_cost:
            new_balance = balance - total_cost
            conn.execute(
                f"UPDATE customers SET balance = {new_balance} WHERE id = {customer_id}"
            )
            conn.execute(
                f"INSERT INTO orders (customer_id, type, quantity, price, total) VALUES ({customer_id}, '{order_type}', {quantity}, {price}, {total_cost})"
            )
            conn.commit()
            print(f"Order successful for {name}. New balance: {new_balance}")
            return {"status": "success", "balance": new_balance}
        else:
            print("Insufficient balance")
            return {"status": "failed", "reason": "insufficient balance"}

    elif order_type == "sell":
        total_revenue = quantity * price
        new_balance = balance + total_revenue
        conn.execute(
            f"UPDATE customers SET balance = {new_balance} WHERE id = {customer_id}"
        )
        conn.execute(
            f"INSERT INTO orders (customer_id, type, quantity, price, total) VALUES ({customer_id}, '{order_type}', {quantity}, {price}, {total_revenue})"
        )
        conn.commit()
        print(f"Sell order for {name}. New balance: {new_balance}")
        return {"status": "success", "balance": new_balance}

    return None
```

## 1. What Does This Function Do?

Imagine you run a gold shop counter. A customer walks in and says, "I want to buy 2 baht-weight of gold at 32,000 THB per baht-weight." Your job as the cashier is to check their wallet, do the math, hand over the gold, take the money, and write a receipt.

That's exactly what `process_gold_order` does, it's the **cashier at the gold counter**. Specifically, it takes four pieces of information (who's ordering, buy or sell, how much gold, and at what price), then it looks up the customer's account balance in a database, calculates the total cost or revenue, updates their balance, records the transaction, and returns a success or failure message.

For a **buy order**, it checks if the customer can afford it (like checking their wallet before ringing up the sale). For a **sell order**, it adds revenue to their balance (like putting cash into the register after accepting gold from a customer).


## Brief Solution Proposal

### Security

- SQL Injection → Use parameterized queries (`?`)

### Correctness

- No Sell Validation → Validate holdings before sell
- No Price Validation → Validate price within tolerance (±0.5%)
- Float Arithmetic → Use `Decimal` with `ROUND_HALF_EVEN`
- No Input Validation → Add input validation layer
- No Quantity Limits → Enforce min/max limits
- No Inventory Check → Validate available inventory
- Raw String Types → Replace with Enum

### Reliability

- No Transaction Safety → Use atomic DB transactions (`with conn:`)
- Race Condition → Use row-level locking (`SELECT ... FOR UPDATE`)
- No Connection Cleanup → Use context manager / `finally`

### Maintainability

- No Logging → Add structured logging
- Hardcoded DB Path → Use config/DI
- Code Duplication → Extract reusable logic
- Loose Parameters → Use DTO/dataclass

### Readability

- Vague Naming → Use descriptive names


## Summary Table

### Security

| # | Problem | Severity | Priority | Core Risk | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | SQL Injection | 🔴 Critical | P0 | Data breach / unauthorized access | Use parameterized queries (`?`) |

### Correctness

| # | Problem | Severity | Priority | Core Risk | Fix |
| --- | --- | --- | --- | --- | --- |
| 6 | No Sell Validation | 🔴 Critical | P0 | Negative holdings / financial fraud risk | Validate gold holdings before sell |
| 13 | No Price Range Validation | 🔴 Critical | P1 | Trades at stale/manipulated prices | Validate against live market price (±0.5%) |
| 3 | Float Arithmetic | 🟠 High | P1 | Financial inaccuracies / rounding errors | Use `Decimal` |
| 4 | No Input Validation | 🟠 High | P1 | Invalid trades / corrupted data | Validate inputs before processing |
| 14 | No Quantity Limits | 🟠 High | P2 | Market manipulation / inventory exhaustion | Enforce `MIN/MAX_ORDER_QUANTITY` |
| 16 | No Gold Inventory Check | 🟠 High | P2 | Unfulfillable obligations | Verify available inventory before buy |
| 9 | Raw String Order Types | 🟡 Medium | P3 | Invalid states / bugs | Use Enum (`OrderType`) |

### Reliability

| # | Problem | Severity | Priority | Core Risk | Fix |
| --- | --- | --- | --- | --- | --- |
| 2 | No Transaction Safety | 🔴 Critical | P0 | Inconsistent data / money mismatch | Use `with conn:` (atomic) |
| 15 | Race Condition (TOCTOU) | 🔴 Critical | P1 | Double-spend / customer gets free gold | `SELECT ... FOR UPDATE` row locking |
| 5 | No Connection Cleanup | 🟠 High | P1 | Resource leaks / system instability | Use context manager / `finally: close()` |

### Maintainability

| # | Problem | Severity | Priority | Core Risk | Fix |
| --- | --- | --- | --- | --- | --- |
| 7 | No Logging | 🟡 Medium | P2 | No audit trail / hard to debug | Add structured logging |
| 8 | Hardcoded DB Path | 🟡 Medium | P2 | Environment mix-ups / unsafe testing | Use dependency injection (DI) |
| 10 | Code Duplication | 🟡 Medium | P3 | Bug-prone / hard to maintain | Extract reusable repository logic |
| 11 | Loose Parameters | 🟡 Medium | P3 | Missing/incorrect data handling | Use DTO (`dataclass`) |

### Readability

| # | Problem | Severity | Priority | Core Risk | Fix |
| --- | --- | --- | --- | --- | --- |
| 12 | Vague Naming | 🟡 Medium | P3 | Misunderstanding / developer errors | Use descriptive naming |



## Fix Roadmap

| Priority | Problems | When |
| --- | --- | --- |
| P0 | 1, 2, 6 | Before next deploy |
| P1 | 3, 4, 5, 13, 15 | This sprint |
| P2 | 7, 8, 14, 16 | Next sprint |
| P3 | 9, 10, 11, 12 | Scheduled refactor |


## Detailed Problem Analysis & Final Fixes

### 🔴 Problem 1 — SQL Injection (Security | P0)

```
# DANGEROUS: Raw string concatenation
"SELECT balance, name FROM customers WHERE id = " + str(customer_id)

# DANGEROUS: f-string interpolation
f"INSERT INTO orders ... VALUES ({customer_id}, '{order_type}', ...)"
```

**Why It Matters:** Database query is built by concatenating raw user input directly into SQL strings. In a gold trading system, this means any external caller could inject malicious SQL to steal customer data, modify balances, delete transaction records, or drop entire tables. A single attack could compromise every customer account and expose the company to catastrophic legal and financial liability.

**Fix:** Replace all string concatenation with parameterized queries using `?` placeholders, so the database engine treats user input strictly as data, never as executable commands.

```
# SAFE: Parameterized query — the database treats inputs as DATA, never as commands
cursor = conn.execute(
    "SELECT balance, name FROM customers WHERE id = ?",
    (customer_id,)
)
```


### 🔴 Problem 2 — No Transaction Safety (Reliability | P0)

```
conn.execute(
f"UPDATE customers SET balance = {new_balance} WHERE id = {customer_id}"
)
conn.execute(
f"INSERT INTO orders (customer_id, type, quantity, price, total) VALUES ({customer_id}, '{order_type}', {quantity}, {price}, {total_cost})"
)
conn.commit()
```

**Why It Matters:** The function performs two separate database writes (update balance, then insert order record) without wrapping them in an atomic transaction. If the system crashes between these two operations, the customer's money disappears but no order is recorded — or an order exists but the balance was never deducted. In financial systems, this kind of partial update destroys auditability and creates irreconcilable discrepancies between accounts and transaction logs.

**Fix:** Wrap both operations inside a `with conn:` context manager, which guarantees that either both writes succeed together or both are rolled back entirely.

```
# SAFE: Atomic transaction — either BOTH writes succeed, or NEITHER does
try:
    with conn:  # SQLite context manager auto-commits on success, auto-rolls-back on failure
        conn.execute(
            "UPDATE customers SET balance = ? WHERE id = ?",
            (new_balance, customer_id)
        )
        conn.execute(
            "INSERT INTO orders (...) VALUES (?, ?, ?, ?, ?)",
            (customer_id, order_type, quantity, price, total_cost)
        )
except sqlite3.Error as e:
    logging.error(f"Transaction failed for customer {customer_id}: {e}")
    return {"status": "failed", "reason": "transaction_error"}
```

### 🔴 Problem 6 — No Sell Validation (Correctness | P0)

```
elif order_type == "sell":
    total_revenue = quantity * price
    new_balance = balance + total_revenue
```

**Why It Matters:** The sell path has zero validation — it blindly adds revenue to the customer's balance without verifying that the customer actually owns the gold they claim to be selling. This means any customer can sell unlimited phantom gold they never purchased, effectively generating infinite money. In a real trading platform, this is an open door to fraud that would be exploited within hours of deployment.

**Fix:** Query the customer's gold holdings before executing any sell order and reject the transaction if holdings are insufficient.

```
if order_type == "sell":
    gold_holdings = _get_customer_gold_holdings(conn, customer_id)
    if gold_holdings < quantity:
        return {"status": "failed", "reason": "insufficient_gold_holdings"}
```

### 🔴 Problem 13 — No Price Range Validation (Correctness | P1)

```
total_cost = quantity * price
```

**Why It Matters:** The function accepts whatever price the caller passes and uses it directly without comparing it to the current market price. Gold prices fluctuate throughout the day, and the gap between a quoted price and the actual market price can represent significant money. A stale price, a manipulated price, or even a simple frontend bug could cause the company to sell gold far below market value or buy it far above — eroding the company's spread on every mispriced transaction.

**Fix:** Validate the quoted price against a live market price feed and reject orders that deviate beyond an acceptable tolerance.

### 🔴 Problem 15 — Race Condition / TOCTOU (Reliability | P1)

```
cursor = conn.execute(
"SELECT balance, name FROM customers WHERE id = " + str(customer_id)
)
customer = cursor.fetchone()
balance = customer[0]
```

**Why It Matters:** When two concurrent requests arrive for the same customer, both read the same balance before either writes. Both pass the balance check, both deduct from the same starting balance, and the customer effectively spends the same money twice — receiving double the gold while only being charged once. Under real trading volume with concurrent API calls, this is not theoretical; it is a guaranteed source of financial loss.

**Fix:** Use database-level row locking to ensure that once a transaction reads a customer's balance, no other transaction can read or modify that row until the first transaction completes.
