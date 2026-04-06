# gold-trading




## Order Validation Module

This project implements a gold trading order validation system in two stages.



## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Benzson92/gold-trading.git
cd gold-trading
```

### 2. Install Dependencies

```bash
yarn
```



## Part 2: Core Validation

Validates incoming orders using deterministic, stateless rules.

### Run Demo

```bash
yarn demo
```

### Run Tests

```bash
yarn test src/tests/validate-order.test.ts
```

### Responsibilities

* Validate input structure
* Enforce business rules (price tolerance, quantity limits)
* Ensure security constraints
* Reject invalid orders before execution



## Part 3: Extended Business Logic

Adds context-aware and stateful validation on top of core rules.

### Run Demo

```bash
yarn demo-extended
```

### Run Tests

```bash
yarn test src/tests/validate-order-extended.test.ts
```

### Responsibilities

* Apply daily trading limits
* Enforce user-specific constraints
* Perform risk and aggregation checks
* Incorporate real-world trading logic



## Architecture Overview

| Layer  | Description                                |
| ------ | ------------------------------------------ |
| Part 2 | Pure validation (stateless, deterministic) |
| Part 3 | Business logic (stateful, contextual)      |



## Recommended Workflow

```bash
# Core validation
yarn test src/tests/validate-order.test.ts

# Extended logic
yarn test src/tests/validate-order-extended.test.ts

# Manual demos
yarn demo
yarn demo-extended
```


