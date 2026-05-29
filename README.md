# I Hate Invoices

I Hate Invoices is a lightweight invoicing SaaS for independent workers and small businesses. Users can sign up, manage client records, create invoices, export saved invoices as PDFs, track invoice status, and upgrade from a free monthly invoice limit to a Pro subscription.

The repository folder and Vercel project may still be named `invoice-gen`, but the customer-facing product is **I Hate Invoices** at `ihateinvoices.com`.

## Stack

- Next.js App Router 16 with React 19
- Tailwind CSS 4 and custom CSS
- Supabase Auth, Postgres, RLS, and SSR cookies
- Stripe Checkout, Billing Portal, and webhooks
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
npm run typecheck
npm run build
npm run smoke
npm audit --audit-level=low
```

`npm run verify` runs lint, typecheck, and build together. `npm run readiness` checks release-critical files, protected-copy expectations, and the saved-only PDF export rule. `npm run smoke` checks local or preview route responses and baseline security headers.

## CI

GitHub Actions runs `npm ci`, `npm run verify`, `npm run readiness`, starts the production server, and runs `npm run smoke` on pushes to `main` and pull requests. This proves the committed source can install, build, serve the public/protected smoke routes, and retain key release guardrails. It does not replace authenticated user QA, Supabase migration approval, production deployment approval, or live Stripe payment testing.

## Production Notes

Production is not ready for paid launch until the current billing/legal API surface is deployed, live Stripe Product/Price/webhook/portal are configured, Supabase migrations are confirmed live, and authenticated QA proves signup, invoice creation, quota enforcement, checkout, webhook entitlement, billing portal, cancellation, and password reset.

Do not treat a migration file in this repo as proof that the hosted Supabase database has been changed.

## Troubleshooting

- Login loops usually mean Supabase browser auth is not writing SSR-compatible cookies or the Supabase redirect URL/domain allowlist is wrong.
- Billing route `404` in production means the deployed production build does not contain the current `app/api/billing/*` routes.
- Stripe webhook `400` without a signature is expected.
- Missing `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, or `STRIPE_WEBHOOK_SECRET` will break billing routes server-side.
