# YOUTENT workflow repair package

## Included fixes
- Wallet release function no longer relies on partial-index `ON CONFLICT` inference.
- Release is idempotent per payment and moves only the freelancer's project amount from pending to available.
- Legacy paid projects with an approved latest delivery but a pending escrow marker can be held and released transactionally.
- Delivery page retries release for already-approved deliveries when the client opens that project's delivery page.
- Release failures are shown to the client instead of being silently swallowed.
- Dashboard uses dynamic rendering for fresh project counts.
- Project chat schema and activity notification triggers are included in the migration.
- Review notifications and per-gig rating summaries are included.
- The ZIP intentionally excludes `.env.local`; keep your own local file.

## Database
The current connected YOUTENT Supabase project was checked and the chat table, wallet release/hold functions, and notification triggers were applied there. The migration in `supabase/migrations/20261014170000_youtent_complete_workflow_fix.sql` keeps the changes reproducible in source control. Do not manually update wallet balances.

## Build/deploy
1. Extract this folder over your project (keep your own `.env.local`).
2. Run `npm ci` or `npm install`.
3. Run `npm run build`.
4. Only if the build passes: `git add .`, commit, and push to `main`.

## Recover already-approved projects
After deployment, sign into the client account that owns each approved project and open that project's `/delivery` page once. The page retries the idempotent release RPC. Then refresh the freelancer's `/wallet` page. The wallet is an internal ledger; actual bank withdrawal still requires a separate KYC/payout integration.
