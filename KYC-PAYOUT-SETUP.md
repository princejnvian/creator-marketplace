# YOUTENT KYC / payout setup

## Important current state
- The database migration adds `creator_payout_profiles` and `withdrawal_requests` without changing existing wallet/payment/project rows.
- `/wallet/kyc` shows KYC state and only redirects to an HTTPS Razorpay-hosted URL configured server-side.
- The start-onboarding API deliberately refuses to collect Aadhaar/PAN images, OTPs, bank credentials, or to guess a provider URL.
- `RAZORPAY_ROUTE_ONBOARDING_URL` is intentionally blank until Razorpay confirms Route/marketplace onboarding is enabled for the YOUTENT merchant and supplies the appropriate approved flow.
- Actual bank withdrawals are NOT enabled by this foundation. The internal `wallets.available_balance` is a ledger amount, not proof that money has been paid out. Do not mark withdrawal requests as paid until an actual payout provider API and verified status/webhook are integrated.

## Next provider-side steps
1. In Razorpay Dashboard, check whether Route is enabled for this merchant. If not, request Route/marketplace Linked Accounts and the relevant onboarding/transfer capability from Razorpay support.
2. Ask Razorpay to confirm whether the intended payout path is Route transfers from captured project payments (held until delivery approval) or RazorpayX Payouts from the platform's own balance. These are different products and cannot safely be treated as interchangeable.
3. Once Razorpay provides the approved hosted onboarding flow, set `RAZORPAY_ROUTE_ONBOARDING_URL` in Vercel Production/Preview as appropriate and in local `.env.local` if testing locally. Keep it server-only; never prefix it with `NEXT_PUBLIC_`.
4. Integrate provider account creation/status webhooks and payout execution/reconciliation only after confirming the enabled product, API scopes, and the merchant's actual fund flow.

## Deploy
Run `npm install` and `npm run build` before deploying. Preserve `.env.local` separately.
