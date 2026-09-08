This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## YOUTENT Marketplace v3 flow

The rebuild keeps the existing minimal YOUTENT visual language and adds a cleaner marketplace flow:

- Client dashboard: service search + recommended creator/portfolio cards.
- Creator discovery: portfolio-first cards, skills and starting price.
- Creator profile: portfolio, categories, skills, packages, rating and direct pre-hire messaging.
- Hire flow: project request → creator acceptance → payment page → verified payment → active project workspace.
- Project workspace: requirements, project chat, private files and delivery workflow.
- Delivery: submit → request revision → resubmit → client approval.
- Completion: release workflow → freelancer wallet credit → client review.
- Freelancer wallet: available/pending balance and transaction history.

### Required database migration

Run `marketplace-v3.sql` in Supabase SQL Editor after the existing marketplace SQL. It adds wallet, transaction, revision, review and pre-hire message tables plus the atomic payment-release function.

### Payment / escrow note

The application now models the marketplace escrow lifecycle in the database: captured payment is marked funded/held, and it is released to the freelancer wallet only after client delivery approval. Actual custody and payout to a freelancer's bank account still require the payment provider's supported marketplace/route/linked-account product and applicable KYC/compliance configuration. The wallet page therefore does not pretend to send real bank payouts until that provider integration is configured.

## YOUTENT v8 UI updates
- Fixed controlled numeric price inputs so values can be fully cleared with Backspace instead of snapping back to 0.
- Added persistent Light/Dark theme toggle in the marketplace header. Dark is the default and uses a subtle textured gradient background.
- Added freelancer wallet summary to the profile preview with available and pending balances and a Wallet link.
- Preserved the existing marketplace payment, requests, files, delivery, review, and portfolio lightbox flows.
