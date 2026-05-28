# I Hate Invoices Launch Checklist

## Before Beta

- [ ] Commit and push all launch-critical files; `git status --short` must be clean except ignored local env/build files.
- [ ] Deploy the current source to a preview URL.
- [ ] Confirm preview returns `200` for `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/refunds`.
- [ ] Confirm preview returns `401` for unauthenticated `/api/billing/status`.
- [ ] Confirm preview Stripe webhook returns `400` without a Stripe signature.
- [ ] Run signup, email verification, login, logout, password reset.
- [ ] Add a client.
- [ ] Create saved invoices until the free limit is hit.
- [ ] Confirm unsaved invoice PDF download is not available.
- [ ] Download a saved invoice PDF.
- [ ] Confirm dashboard billing status and upgrade button behavior.
- [ ] Verify legal pages include current company/contact data from `lib/company.ts`.

## Before Public Paid Launch

- [ ] Apply and verify Supabase production migrations.
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
- [ ] Add tested CSP, rate limiting, and CSRF/origin checks.
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
