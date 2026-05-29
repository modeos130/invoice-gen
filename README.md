# I Hate Invoices

I Hate Invoices is a lightweight invoicing SaaS for independent workers and small businesses. Users can sign up, manage client records, create invoices, export saved invoices as PDFs, track invoice status, and upgrade from a free monthly invoice limit to a Pro subscription.

The repository folder and GitHub repository are still named `invoice-gen`, but the Vercel project has been renamed to `ihateinvoices` and the customer-facing product is **I Hate Invoices** at `ihateinvoices.com`.

## Stack

- Next.js App Router 16 with React 19
- Tailwind CSS 4 and custom CSS
- Supabase Auth, Postgres, RLS, and SSR cookies
- Stripe Checkout, Billing Portal, and webhooks
- Shared branded app shell for protected dashboard, client, and invoice pages
- React PDF for saved invoice PDF exports
- Vercel deployment

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Run locally:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Required Environment Variables

See `.env.example` for the complete list.

Preview/development can use Stripe test-mode keys. Production must use live Stripe objects only after live-money setup is approved and tested.

## Validation Commands

```bash
npm run lint
npm run readiness
npm run test:unit
npm run typecheck
npm run build
npm run smoke
npm audit --audit-level=low
```

`npm run verify` runs lint, typecheck, and build together. `npm run readiness` checks release-critical files, protected-copy expectations, and the saved-only PDF export rule. `npm run test:unit` runs Vitest tests for pure helpers. `npm run smoke` checks local or preview route responses and baseline security headers.

## CI

GitHub Actions runs `npm ci`, `npm run verify`, `npm run readiness`, `npm run test:unit`, starts the production server, and runs `npm run smoke` on pushes to `main` and pull requests. The current `main` branch has passed CI and production route smoke on both `ihateinvoices.com` domains. CI does not replace authenticated user QA, Supabase migration approval, or live Stripe payment testing.

## Production Notes

Production serves the current public, legal, auth, billing, and webhook route surface on `https://www.ihateinvoices.com`. Live Stripe Product/Price/webhook/portal variables are configured in Vercel Production, and the owner completed a live Pro checkout, billing portal open, invoice creation, status update, and PDF download test. Remaining launch checks are final owner/legal review, any desired test-data cleanup, delete/archive product decisions, and ongoing production log monitoring.

Signup and verification emails must redirect through `/auth/callback?next=/dashboard`, not directly to `/dashboard`. The callback exchanges the Supabase code for SSR cookies before sending the user into the protected workspace, which prevents confirmation links from landing on stale or unauthenticated protected pages.

Do not treat a migration file in this repo as proof that the hosted Supabase database has been changed.

`INVOICE_CREATE_RPC_ENABLED` must stay `false` until authenticated invoice QA verifies the target environment. The Supabase migrations through `20260529121916_grant_create_invoice_atomic.sql` are applied to the linked hosted project, and `/api/invoices` can use the `create_invoice_atomic` RPC for quota enforcement and invoice numbering once the flag is enabled.

## Troubleshooting

- Login loops usually mean Supabase browser auth is not writing SSR-compatible cookies or the Supabase redirect URL/domain allowlist is wrong.
- Email confirmation links that land on an old page usually mean the deployed Supabase email redirect URL or deployed source is stale. Confirm `/auth/callback` is deployed and allowlisted in Supabase Auth URL settings.
- Billing route `401` for unauthenticated requests is expected; authenticated billing failures usually mean missing Stripe or Supabase server env values.
- Stripe webhook `400` without a signature is expected.
- Missing `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, or `STRIPE_WEBHOOK_SECRET` will break billing routes server-side.
