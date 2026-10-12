# YOUTENT — checkout and payment setup

This package restores the full creator/gig UI from the supplied source ZIP. It does not include your local `.env.local` or any secret keys. Existing Supabase data is not deleted by these app changes.

## Intended order flow

1. Client opens a creator profile and selects a published gig package.
2. `POST /api/checkout-orders` authenticates the client, re-reads the package price from Supabase, creates a checkout record, and creates a Razorpay order server-side.
3. Checkout page displays the package price, platform fee, delivery and revisions.
4. Razorpay Checkout opens using the server-created order ID.
5. The server verifies the Razorpay signature, then independently fetches the order and payment from Razorpay and checks order ID, INR currency, exact amount, and `captured` status.
6. Supabase `finalize_checkout_payment` atomically creates the project and payment ledger/hold, marks checkout paid, and returns the project ID. The browser then opens `/projects/<id>`.
7. If the browser callback is interrupted, `Check Payment Status` and the signed Razorpay webhook attempt safe, idempotent recovery. A captured payment is never treated as permission to charge again.

## Apply in this order

1. Extract this ZIP over a working copy of the project. Keep your existing `.env.local` file separately; this ZIP deliberately omits it.
2. In Supabase SQL Editor, run `supabase/migrations/20261013150000_checkout_payment_rebuild.sql` **after reviewing it**. It replaces the canonical four-argument finalizer to align its parameter names with the app RPC calls. It expects your existing `checkout_orders`, `projects`, `payments` tables and `hold_project_payment(uuid)` function to be present.
3. Configure local `.env.local` and the same production environment variables in Vercel:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=a_secret_you_set_for_the_webhook
   ```

   Keep the service-role and Razorpay secret values server-side only. Never use `NEXT_PUBLIC_` for secrets or commit `.env.local`.
4. In Razorpay Dashboard, initially use **Test Mode** keys. Add a webhook pointing to `https://YOUR-DOMAIN/api/razorpay/webhook`, subscribe to `payment.captured` and `payment.failed`, and use the exact same webhook secret in `RAZORPAY_WEBHOOK_SECRET`. The webhook secret is separate from the Razorpay key secret.
5. Run `npm install` and `npm run build`. Do not deploy until the build passes.
6. Deploy to a preview URL and test with Razorpay test-mode payment methods. Confirm all three things: checkout says paid, one project appears in the client's Projects page, and that project's detail page opens. Also test a failed/cancelled payment and confirm it does not create a project.
7. After the test flow works, switch to live keys in Vercel only and test a low-value real transaction. Do not change live keys before test mode passes.

## Important safety checks

- Never manually mark a checkout as paid based only on a browser redirect or screenshot.
- Never rerun payment or ask the client to pay again when Razorpay shows a captured payment. Use `Check Payment Status`/webhook recovery and reconcile the same checkout.
- If the SQL migration fails because your live schema differs, stop and share the exact Supabase error before trying destructive SQL.
- This ZIP was structurally checked, but a full Next.js build and a live Razorpay transaction have **not** been run here. Those are required before production use.
