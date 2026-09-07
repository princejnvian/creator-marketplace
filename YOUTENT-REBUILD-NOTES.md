# YOUTENT Marketplace Rebuild

## What was fixed in this rebuild
- Kept the existing YOUTENT marketplace UI direction and made the page background softer (cool blue/grey/lilac) instead of flat white.
- Increased card depth with darker, softer slate shadows.
- Prevented horizontal page overflow.
- Fixed the category mega-menu so it stays centered inside the viewport instead of being clipped off the left/right edge.
- Fixed the profile-save API so categories, skills, pricing, packages and portfolio are persisted through the server-side Supabase admin client.
- Fixed Accept Request: project creation now runs through the trusted server-side admin client after creator authorization, avoiding the `projects` RLS INSERT failure.
- Fixed Decline Request: the state transition now uses the trusted server-side update and returns a JSON success state, so the UI reliably moves to Declined.
- Fixed the action component so accepted requests navigate to the payment page and declined requests refresh into the Declined state.
- Added `SUPABASE-REQUEST-MESSAGE-FIX.sql` for the missing `creator_messages` table and profile/portfolio schema.

## Database
The project includes:
- `supabase-youtent-marketplace.sql` for profile/portfolio fields and portfolio storage bucket.
- `marketplace-v3.sql` for wallets, reviews, revisions, creator messages and escrow ledger fields.

Run these in Supabase SQL Editor if those migrations have not already been applied.

## Environment variables
Keep the existing local/Vercel environment variables. Do not put real secrets in the ZIP.

Required server-side variables include the existing Supabase URL/publishable key and Supabase service-role key used by the API routes, plus the existing Razorpay variables.
