# YOUTENT payment finalization recovery fix

Changes in this ZIP:
- Fixes the PostgreSQL `ON CONFLICT` target to match the partial unique index on `wallet_transactions(payment_id, type)` for `hold` and `release`. The previous mismatch can make the atomic finalizer roll back after Razorpay has captured the payment.
- Adds the corrected hold/release functions to `CHECKOUT-PAYMENT-ATOMIC-FINALIZE.sql`.
- Requests a PostgREST schema-cache reload after the migration.
- The checkout status endpoint now securely checks Razorpay's API for an already-captured payment and retries the idempotent finalizer, so an existing captured test payment can be recovered without paying again.
- Checkout shows `Payment Paid` and `Open Project` only after the backend returns a real project ID. Otherwise it shows a captured/pending status and does not offer another payment button.

Apply `CHECKOUT-PAYMENT-ATOMIC-FINALIZE.sql` in Supabase SQL Editor after confirming the existing payment tables/functions are present. Keep `.env.local` locally; it is intentionally excluded from this ZIP. Do not commit any secrets.
