# I Hate Invoices Launch Checklist

## Before Beta

- [ ] Commit and push all launch-critical files; `git status --short` must be clean except ignored local env/build files.
- [ ] Confirm GitHub Actions CI passes on the pushed commit.
- [ ] Confirm local `npm run readiness` and `npm run smoke` pass before preview deploy.
- [ ] Deploy the current source to a preview URL.
- [ ] Confirm preview returns `200` for `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/refunds`.
- [ ] Confirm preview returns `404` with branded fallback UI for an unknown route.
- [ ] Confirm preview returns `401` for unauthenticated `/api/billing/status`.
- [ ] Confirm preview Stripe webhook returns `400` without a Stripe signature.
- [ ] Run signup, email verification, login, logout, password reset.
- [ ] Add a client.
- [ ] Create saved invoices until the free limit is hit.
- [ ] Apply `supabase/migrations/20260529090606_atomic_invoice_create.sql` to preview, enable `INVOICE_CREATE_RPC_ENABLED=true`, and verify concurrent invoice creates.
- [ ] Confirm unsaved invoice PDF download is not available.
- [ ] Download a saved invoice PDF.
- [ ] Confirm dashboard billing status and upgrade button behavior.
- [ ] Verify legal pages include current company/contact data from `lib/company.ts`.

## Before Public Paid Launch

- [ ] Confirm CI, preview smoke, and authenticated manual QA all pass on the release commit.
- [ ] Apply and verify Supabase production migrations.
- [ ] Enable `INVOICE_CREATE_RPC_ENABLED=true` only after the atomic invoice migration is verified in that environment.
- [ ] Configure production `NEXT_PUBLIC_APP_URL=https://www.ihateinvoices.com`.
- [ ] Configure live Stripe `STRIPE_SECRET_KEY`.
- [ ] Configure live Stripe recurring Pro Price and `STRIPE_PRO_PRICE_ID`.
- [ ] Configure production Stripe webhook endpoint at `/api/stripe/webhook`.
- [ ] Configure production `STRIPE_WEBHOOK_SECRET`.
- [ ] Configure Stripe Customer Portal.
- [ ] Run a controlled live subscription test.
- [ ] Verify webhook grants Pro entitlement.
- [ ] Verify cancellation removes Pro entitlement.
- [ ] Decide sales tax/VAT handling with accountant guidance.
- [ ] Add tested CSP and confirm production abuse-monitoring coverage.
- [ ] Add monitoring/error tracking.
- [ ] Add automated E2E and RLS tests.

## After Launch

- [ ] Monitor signups, first invoice completion, free-limit hits, checkout starts, checkout completions, cancellations, and support requests.
- [ ] Review Stripe failed payments and webhook delivery daily for the first week.
- [ ] Review Supabase auth/database logs daily for the first week.
- [ ] Add client edit/delete, invoice edit/delete, search/filter/sort, and mobile table improvements.

## Emergency Rollback

1. Revert Vercel production to the previous known-good deployment.
2. Disable live Stripe webhook endpoint or pause checkout links if billing is impacted.
3. Keep Supabase destructive rollback manual and approved; do not run destructive SQL without owner approval.
4. Post an internal incident note with affected route, time window, customer impact, and recovery action.
