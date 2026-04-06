// ============================================================================
// security.constants.ts — Front Desk Security Rules
// ============================================================================
// Chef Analogy: The front desk checks every reservation name for weird
// characters. "Robert'); DROP TABLE customers;--" is not a valid name.
// This pre-compiled pattern catches injection attempts before they
// reach any kitchen station.
//
// WHY PRE-COMPILED? At high throughput, regex compilation cost adds up.
// Compiling once at module load and reusing is like sharpening the knife
// once per shift instead of before every cut.
// ============================================================================

export const CUSTOMER_ID_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;
