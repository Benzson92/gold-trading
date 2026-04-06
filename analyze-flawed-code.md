
Part 1: Analyze Flawed Code
---

## Brief Version

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
