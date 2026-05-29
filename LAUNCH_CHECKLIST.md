# I Hate Invoices Launch Checklist

## Before Beta

- [ ] Commit and push all launch-critical files; `git status --short` must be clean except ignored local env/build files.
- [ ] Confirm GitHub Actions CI passes on the pushed commit.
- [ ] Confirm local `npm run readiness` and `npm run smoke` pass before preview deploy.
- [ ] Deploy the current source to a preview URL.
- [ ] Confirm preview returns `200` for `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/refunds`.
- [ ] Confirm preview and production return `200` with `ok: true` for `/api/health`.
- [ ] Confirm preview `/auth/callback` without a code redirects safely to `/login`.
- [ ] Confirm preview returns `404` with branded fallback UI for an unknown route.
- [ ] Confirm preview returns `401` for unauthenticated `/api/billing/status`.
- [ ] Confirm preview Stripe webhook returns `400` without a Stripe signature.
- [ ] Confirm CSP is present and does not break signup, dashboard, PDF download, checkout redirect, or billing portal.
- [ ] Run signup, email verification through `/auth/callback`, login, logout, password reset.
- [ ] Confirm successful sign-in lands on the current light dashboard, not the retired dark-blue page.
- [ ] Add a client.
- [ ] Create saved invoices until the free limit is hit.
- [ ] Enable `INVOICE_CREATE_RPC_ENABLED=true` in a controlled environment and verify concurrent invoice creates.
- [ ] Confirm unsaved invoice PDF download is not available.
- [ ] Download a saved invoice PDF.
- [ ] Confirm protected dashboard, clients, new invoice, saved invoice detail, and PDF output use the current product styling.
- [ ] Confirm dashboard billing status and upgrade button behavior.
- [ ] Verify legal pages include current company/contact data from `lib/company.ts`.

## Before Public Paid Launch

- [ ] Confirm CI, preview smoke, and authenticated manual QA all pass on the release commit.
- [ ] Apply and verify Supabase production migrations.
- [ ] Apply and verify archive fields migration `supabase/migrations/20260529175218_add_archive_fields.sql` before deploying matching archive source.
- [ ] Enable `INVOICE_CREATE_RPC_ENABLED=true` only after authenticated invoice QA verifies the RPC path in that environment.
- [ ] Configure production `NEXT_PUBLIC_APP_URL=https://www.ihateinvoices.com`.
- [ ] Configure live Stripe `STRIPE_SECRET_KEY`.
- [ ] Configure live Stripe recurring Pro Price and `STRIPE_PRO_PRICE_ID`.
- [ ] Configure production Stripe webhook endpoint at `/api/stripe/webhook`.
- [ ] Configure production `STRIPE_WEBHOOK_SECRET`.
- [ ] Configure Stripe Customer Portal.
- [ ] Run a controlled live subscription test.
- [ ] Verify webhook grants Pro entitlement.
- [ ] Verify cancellation removes Pro entitlement.
- [ ] Verify invoice archive, invoice restore, client archive, and client restore on production.
- [ ] Decide sales tax/VAT handling with accountant guidance.
- [ ] Confirm production CSP and production abuse-monitoring coverage.
- [ ] Confirm UptimeRobot monitors `https://www.ihateinvoices.com/` and `https://www.ihateinvoices.com/api/health`.
- [ ] Add owner-approved dedicated error tracking if paid traffic increases.
- [ ] Add automated E2E and RLS tests.

## After Launch

- [ ] Monitor signups, first invoice completion, free-limit hits, checkout starts, checkout completions, cancellations, and support requests.
- [ ] Review Stripe failed payments and webhook delivery daily for the first week.
- [ ] Review Supabase auth/database logs daily for the first week.
- [ ] Review Vercel `500` logs daily for the first week.
- [ ] Add client edit, invoice edit/duplicate, search/filter/sort, and mobile table improvements.

## Emergency Rollback

1. Revert Vercel production to the previous known-good deployment.
2. Disable live Stripe webhook endpoint or pause checkout links if billing is impacted.
3. Keep Supabase destructive rollback manual and approved; do not run destructive SQL without owner approval.
4. Post an internal incident note with affected route, time window, customer impact, and recovery action.
