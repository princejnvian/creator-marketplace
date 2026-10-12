# Checkout recovery fix

## Root cause found
The live database had a legacy payment row for a captured direct-gig checkout and an existing project, but `checkout_orders` was still `processing` with `project_id = NULL`. The finalizer rejected retries because it treated the already-created payment row as a duplicate. This migration reconciles only an exact match on Razorpay order/payment IDs, client, freelancer, amount, and project, then initializes the held wallet ledger and links the checkout.

## Apply
1. Run `supabase/migrations/20261012190000_checkout_payment_reconciliation.sql` in the same Supabase project.
2. Deploy the updated app code.
3. Refresh the existing checkout and press Check Payment Status. Do not make a second payment for a captured order.
4. Verify checkout status `paid`, project_id set, payment status `paid`, escrow_status `funded`, and a `wallet_transactions` hold row / pending balance.

Do not use live payments until a full end-to-end test and the payment provider's marketplace settlement approval are confirmed.
