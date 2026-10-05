# YOUTENT — Live Payment Activation Notes

This build keeps the existing server-side Razorpay order creation, payment signature verification, amount verification, and webhook verification.

## Environment variables for production

Set these in Vercel (Production), never commit live secrets to Git:

- `RAZORPAY_KEY_ID=rzp_live_...`
- `RAZORPAY_KEY_SECRET=...`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...`
- `RAZORPAY_WEBHOOK_SECRET=...`

Configure the Razorpay webhook URL to:

`https://YOUR-YOUTENT-DOMAIN/api/razorpay/webhook`

## Marketplace payouts / KYC

The current wallet is an internal ledger for project holds/releases. It is **not** a regulated bank/escrow account. Before enabling real freelancer withdrawals, connect an approved Razorpay marketplace/Route payout setup and complete the required platform/freelancer onboarding/KYC checks. Do not treat `wallets.available_balance` as money that has already been transferred to a bank account.

The intended UX is: earnings remain pending until the project is completed; after release they become available; when the freelancer requests withdrawal, KYC/payout onboarding is required if it has not already been completed.

## Current fee behavior

The existing checkout charges the package price **plus** the calculated platform fee to the client. Example: ₹1,000 package + ₹150 platform fee = ₹1,150 paid by the client. If YOUTENT should instead charge exactly ₹1,000 and deduct the ₹150 platform fee from the freelancer's share, that is a separate fee-model change.
