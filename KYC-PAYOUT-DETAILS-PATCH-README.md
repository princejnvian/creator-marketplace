# YOUTENT freelancer KYC + payout details patch

## Files included
- `app/wallet/kyc/page.tsx`
- `app/wallet/kyc/KycActions.tsx`
- `app/api/kyc/documents/route.ts`
- `app/api/kyc/payout-details/route.ts`
- `supabase/migrations/20261022160000_freelancer_kyc_and_payout_details.sql`

## Apply
1. Copy the included files into the matching paths in your current `creator-marketplace` project. Do not replace `.env.local` or other files from this patch.
2. In Supabase Dashboard → SQL Editor, run `supabase/migrations/20261022160000_freelancer_kyc_and_payout_details.sql`.
3. Confirm Vercel already has `NEXT_PUBLIC_SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`. Never expose the service role key with a `NEXT_PUBLIC_` variable or commit it to Git.
4. Run `npm run build`, then deploy.
5. Test while signed in as a freelancer at `/wallet/kyc`: save bank/UPI details and upload test images before using any real personal documents.

## Security / limitations
- KYC files are stored in a private Supabase Storage bucket, not a public bucket. The upload API requires a signed-in user and stores files under that user's UUID.
- Do not upload real Aadhaar until you have a lawful reason, appropriate privacy notice/consent, retention/deletion policy, and restricted admin review process. Prefer masked Aadhaar where suitable. An image upload is not official Aadhaar verification.
- This patch adds freelancer submission only. It does not create an admin KYC review screen, automated identity verification, payout provider approval, or automatic withdrawals. A manual-review status is saved for later admin review.
- Existing wallet/payment records are not modified by the migration.
