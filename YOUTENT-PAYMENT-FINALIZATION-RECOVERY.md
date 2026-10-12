# YOUTENT Payment Finalization Recovery

This patch fixes the observed database blockers:
1. `projects.request_id` was NOT NULL, but direct gig checkout intentionally inserts NULL because no `project_requests` row exists.
2. The deployed app may call the finalizer with the five-argument paise/currency signature while the original database function has four arguments. The migration adds a validating wrapper for that call shape.
3. The checkout status API now checks the Razorpay order for a captured INR payment, verifies its amount, and calls the canonical database finalizer. This recovers captured payments even after the browser callback failed.
4. The checkout UI shows `Payment Paid` and `Open Project` only when the backend returns a real project ID.

Keep Razorpay secrets in `.env.local`/Vercel Environment Variables only. Do not test with a second payment while an earlier Razorpay payment is captured but its project is pending.

Run:
  npm install
  npm run build

The migration in `supabase/migrations/20261012150000_payment_finalization_recovery.sql` should be run against the YOUTENT Supabase project if not already applied. It is written to be repeatable.
