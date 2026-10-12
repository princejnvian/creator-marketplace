# YOUTENT payment integration readiness

## Fee model

The client pays the gig package price plus the calculated YOUTENT platform fee. Current fee bands are maintained in `lib/platform-fee.ts`:

- Package price up to ₹499: 20%
- ₹500–₹1,999: 15%
- ₹2,000 and above: 10%

For a ₹1,000 package, the client total is ₹1,150. The ₹1,000 package amount is the freelancer's project earning and remains pending until client approval. The ₹150 fee is separately recorded as `platform_fee`.

## One required database migration

Before deploying the updated direct-gig checkout routes, open Supabase Dashboard → SQL Editor and run the complete contents of `CHECKOUT-PAYMENT-ATOMIC-FINALIZE.sql`. Do not paste this Markdown note into SQL Editor.

This migration creates a server-only, atomic finalization function shared by the browser callback and Razorpay webhook. It locks the checkout row, checks the amount and Razorpay order ID, creates the project and payment ledger, applies the pending hold, and marks the checkout paid in one transaction. Repeated callbacks/webhooks return the existing project instead of creating another one.

The migration assumes the existing YOUTENT marketplace schema and `public.hold_project_payment(uuid)` function from the payment/escrow migrations are already installed.

## Vercel environment variables

Set these under Vercel → Project → Settings → Environment Variables; never commit real secrets:

- `RAZORPAY_KEY_ID` — test key while testing; live key only after Razorpay approval
- `RAZORPAY_KEY_SECRET` — matching secret for that key
- `RAZORPAY_WEBHOOK_SECRET` — strong secret configured identically in the Razorpay webhook settings
- Supabase environment variables already used by the app

Webhook URL: `https://YOUR-DOMAIN/api/razorpay/webhook`
Subscribe to at least `payment.captured` and `payment.failed`.

## Important launch limitation

The YOUTENT wallet is an internal ledger, not a regulated escrow account or proof that funds have been transferred to a freelancer. The current checkout records the client total and holds the package price in the internal ledger; it does not by itself split/settle money to linked freelancer bank accounts. Before accepting real money at scale or enabling real withdrawals, obtain Razorpay approval for the marketplace business model and implement its supported linked-account/Route settlement, KYC, refund, dispute and payout flows. Do not mark a withdrawal successful unless a payout provider confirms it.

## Security

The source ZIP supplied for this update included a local `.env.local`. It has intentionally been removed from the output ZIP. Keep local environment files out of source archives and Git. Rotate any credential that has been shared outside a trusted environment; never send live keys in chat.
