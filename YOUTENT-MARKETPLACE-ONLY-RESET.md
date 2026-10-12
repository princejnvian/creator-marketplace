# YOUTENT — Marketplace-only reset

This temporary build keeps creator discovery, creator profiles, gig listings, package details, authentication, and existing project areas.

## Disabled intentionally
- Gig order/checkout action is disabled in the UI.
- Legacy checkout page shows a pause notice and does not initialize payment.
- Legacy project payment page shows a pause notice.
- Checkout/order/payment/webhook API routes return HTTP 410 and perform no database writes or gateway calls.
- The `razorpay` runtime dependency has been removed from package.json and package-lock.json.

No database migrations are required for this temporary reset. Existing database records are not deleted. Existing environment variables are not modified.

## Validate locally
```powershell
npm install
npm run build
npm run dev
```

Order buttons should be disabled, gigs remain browseable, and old checkout/payment API requests should return 410.
