# YOUTENT project chat + checkout recovery patch

## Fixes
- Project messages are now keyed by `project_id`, so direct gig-checkout projects with `request_id = NULL` no longer send the literal `null` into a UUID filter.
- Checkout status polling checks Razorpay's authoritative order/payment state and retries the idempotent `finalize_checkout_payment` RPC for a captured payment.
- Existing payment is never declared successful from browser state alone; the recovery checks captured status, INR currency, order ID, and exact expected amount.

## Required database migration
Apply `supabase/migrations/20261012180000_project_chat_and_checkout_recovery.sql` in the SAME Supabase project used by this deployment. This creates the project-scoped messages table and member-only RLS policies.

## Important
- Keep Razorpay in Test Mode until the full flow is tested.
- Do not pay again for an already captured checkout. Refresh that checkout after deployment; status polling should attempt recovery.
- Build/test locally before pushing. A ZIP cannot prove the remote database, environment variables, webhook configuration, or provider account are correct.
