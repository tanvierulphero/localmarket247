# Security Specification

## Data Invariants
1. Products, customers, and documents require the user to be signed in as staff or admin.
2. A user cannot delete or edit settings unless they are logged in.
3. System-generated fields or credentials cannot be modified maliciously.

## The Dirty Dozen Payloads (Security Attack Vectors)
1. **Unauthenticated Read on Products:** Attempting to fetch products without signing in.
2. **Unauthenticated Write on Products:** Attempting to inject random products without credentials.
3. **Privilege Escalation on User Profile:** Normal staff user trying to promote their role to ADMIN directly.
4. **Invalid SKU formats:** Attempting to save a product with a 1MB junk SKU.
5. **Customer Phone Number Spoofing:** Creating a customer with a non-string or oversized number.
6. **Setting Tampering:** Overwriting core business name with empty strings.
7. **Document Date Injection:** Overwriting a document's creation date with a futuristic date.
8. **Negative Product Price:** Trying to create a product with a negative unit price.
9. **Negative Stock Counts:** Setting stock value to -999.
10. **Document Totals Hijacking:** Creating an invoice with mismatching subtotal/total types.
11. **Malicious ID Injection:** Creating a document with symbols like `../hack` as ID.
12. **PII Data Extraction:** Unsigned user trying to list all customer email addresses.

## Test Runner Definition
Since this is an inline serverless web application in AI Studio, tests are checked by compiling, running ESLint, and evaluating security rule definitions natively in Firestore Rules.
