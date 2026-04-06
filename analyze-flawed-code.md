
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

- No Transaction Safety → Use atomic DB transactions (`with db_connection:`)
- Race Condition → Use row-level locking (`SELECT ... FOR UPDATE`)
- No Connection Cleanup → Use context manager / `finally`

### Maintainability

- No Logging → Add structured logging
- Hardcoded DB Path → Use config/DI
- Code Duplication → Extract reusable logic
- Loose Parameters → Use DTO/dataclass

### Readability

- Vague Naming → Use descriptive names
