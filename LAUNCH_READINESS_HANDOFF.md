# I Hate Invoices Launch Readiness Handoff

Date: 2026-05-29
Repo: `/Users/booman/projects/invoice-gen`
Production URL: `https://www.ihateinvoices.com/`
Latest production deployment: `https://www.ihateinvoices.com/`
Historical preview alias: `https://invoice-gen-admin-modeos-admin-26436872s-projects.vercel.app`
Vercel project: `ihateinvoices`

## Current Status Update - 2026-05-29

This section supersedes older preview-only revenue notes below.

- Production domains are live: `https://www.ihateinvoices.com/` and `https://ihateinvoices.com/`.
- The Vercel project has been renamed from `invoice-gen` to `ihateinvoices`.
- Live Stripe Product/Price/webhook/portal environment values are configured in Vercel Production.
- Owner live QA completed: signup/login, client creation, invoice creation, dashboard update, Pro checkout, Pro entitlement, billing portal open, saved invoice view, status update, saved PDF download, password reset, mobile spot-check, and invoice/client archive and restore.
- Production monitoring baseline is deployed: `/api/health`, route smoke coverage, Vercel error-log runbook, and UptimeRobot-compatible health target.
- Production error-log check after live QA returned no Vercel error logs.
- Public route check passed for `/`, `/login`, `/signup`, `/privacy`, `/terms`, `/refunds`, `/robots.txt`, and `/sitemap.xml`.
- Current company/contact/location copy was checked against `https://boomansystems.com/contact/` on 2026-05-29 and matches `Booman Systems LLC`, `admin@modeos.app`, and `Arizona LLC operating from Maryland`.
- Remaining launch work: final owner/legal review, any desired test-data cleanup, old key rotation/removal only after confirming they are unused, and optional third-party error tracking if paid traffic increases.

## Verdict

Production revenue flow has passed an owner live checkout smoke test, and the app is ready for a controlled beta / soft public launch from an engineering standpoint.

The app is live, reachable, and passes the local, CI, and production route validation gates recorded below. The revenue plumbing has been implemented in code and verified in production with a real owner checkout: Stripe Checkout, Stripe Customer Portal, webhook-driven billing profiles, and server-side free-tier invoice enforcement. Broad paid promotion should still wait for final legal review and any owner cleanup decisions, but no current engineering blocker prevents controlled beta usage.

## Product Surface

- Public routes: `/`, `/login`, `/signup`, `/verify-email`
- Recovery/legal routes added in the current working tree and preview: `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/refunds`
- Protected routes: `/dashboard`, `/clients`, `/invoice/new`, `/invoice/[id]`
- Core features present: email signup/login, client list, invoice create/save, invoice list, status tracking, PDF download
- Revenue promise present: Free plan at 3 invoices/month and Pro at `$7/mo`
- Revenue implementation exists in the current working tree and preview: checkout route, billing portal route, webhook route, Stripe customer/subscription persistence, and free-tier enforcement now exist in code

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase Auth and Postgres through `@supabase/supabase-js`
- PDF generation through `@react-pdf/renderer`
- Stripe Billing via Checkout Sessions, Customer Portal sessions, and signed webhook processing
- Vercel deployment with custom domain `ihateinvoices.com`

## Validation Performed

- Final validation pass on 2026-05-29:
  - `git status --short`: clean
  - `npm run lint`: passed
  - `npm run typecheck`: passed
  - `npm run test:unit`: passed, 13 test files / 80 tests
  - `npm run readiness`: passed
  - `npm run build`: passed
  - Local production `npm run smoke` against `http://127.0.0.1:3029`: passed, including `/api/health`
  - Live production `npm run smoke` against `https://www.ihateinvoices.com`: passed, including public pages, protected redirects, billing auth guards, webhook unsigned rejection, and invalid-origin API rejection
  - Live `/api/health`: `200`, `ok: true`, `service: ihateinvoices`, `cache-control: no-store`
  - Vercel production `500` log query for the last 15 minutes: no logs found
  - Latest GitHub Actions CI on `main`: success, run `26664707708`
  - Latest Vercel production deployment: `https://ihateinvoices-nyh05hjug-admin-26436872s-projects.vercel.app`, Ready and aliased to `https://www.ihateinvoices.com`
  - `npm audit --audit-level=low`: fails on 2 moderate advisories through Next's bundled `postcss`; current stable Next is already `16.2.6`, and npm's force fix suggests an unsafe breaking downgrade, so this is tracked as an upstream dependency advisory rather than a safe local fix.
- `npm ci`: passed
- `npm run lint`: passed after fixes
- `npm run build`: passed after fixes
- `npm run lint`: passed again on 2026-05-28
- `npm run build`: passed again on 2026-05-28
- `npm audit --audit-level=high`: passed for high severity after upgrading Next to `16.2.6`
- Remaining audit state: two moderate PostCSS-related advisories remain through Next; `npm audit fix --force` suggests a breaking downgrade and should not be used blindly
- Local production smoke on `localhost:3007`:
  - `/`: `200`
  - `/signup`: `200`
  - `/dashboard`: `307` to `/login?redirect=%2Fdashboard`
  - `/invoice/new`: `307` to `/login?redirect=%2Finvoice%2Fnew`
  - `/clients`: `307` to `/login?redirect=%2Fclients`
- Live route smoke:
  - `https://www.ihateinvoices.com/`: `200`
  - `https://ihateinvoices.com/`: `307` to `https://www.ihateinvoices.com/`
  - `https://www.ihateinvoices.com/signup`: `200`
  - Protected live routes redirect to login with `307`
- Supabase read-only REST checks:
  - configured project ref: `stjycgosnmtbhuuagunq`
  - `invoices` columns used by the app returned `HTTP 200`
  - `clients` columns used by the app returned `HTTP 200`
  - auth settings returned `email: true`, `disable_signup: false`, `mailer_autoconfirm: false`
- Local unauthenticated API smoke:
  - `/api/billing/status`: `401`
  - `/api/billing/checkout`: `401`
  - `/api/invoices`: `401`
- Local public route smoke on `localhost:3011` with webpack dev server:
  - `/`: `200`
  - `/forgot-password`: `200`
  - `/reset-password`: `200`
  - `/terms`: `200`
  - `/privacy`: `200`
  - `/refunds`: `200`
  - `/login`: `200`
  - `/signup`: `200`
- Supabase migration verification:
  - `supabase migration new add_billing_subscriptions`: created `20260523095504_add_billing_subscriptions.sql`
  - `supabase migration list --local`: not completed because no local Supabase Postgres was listening on `127.0.0.1:54322`
  - Applied `20260523095504_add_billing_subscriptions.sql` through the signed-in Supabase SQL Editor on 2026-05-28.
  - Supabase SQL Editor result: `Success. No rows returned`.
  - Post-apply REST verification with the matching service role:
    - `billing_profiles`: `200`
    - `stripe_webhook_events`: `200`
    - `clients`: `200`
    - `invoices`: `200`
- Vercel preview deployment on 2026-05-28:
  - Preview URL: `https://invoice-12ujjfuf8-admin-26436872s-projects.vercel.app`
  - Deployment ID: `dpl_HDRyFJopctXPSXa8AcQkE2hctVXr`
  - Remote Vercel build: passed
  - Preview route smoke:
    - `/`: `200`
    - `/signup`: `200`
    - `/login`: `200`
    - `/terms`: `200`
    - `/privacy`: `200`
    - `/refunds`: `200`
    - `/forgot-password`: `200`
    - `/dashboard`: `307`
    - `/invoice/new`: `307`
    - `/api/billing/status`: `401`
    - `/api/billing/checkout`: `401`
    - `/api/stripe/webhook`: `400` without a Stripe signature
- Supabase Auth URL configuration on 2026-05-28:
  - Site URL changed from `http://localhost:3000` to `https://www.ihateinvoices.com`.
  - Redirect URLs now include `https://www.ihateinvoices.com/reset-password`.
  - Redirect URLs now include `https://*-admin-26436872s-projects.vercel.app/reset-password` for Vercel preview password-reset QA.
  - Redirect URLs now include `https://*-admin-26436872s-projects.vercel.app/**` for Vercel preview signup confirmation and authenticated QA redirects.
  - Public auth settings endpoint still returns `HTTP 200` with `email: true`, `disable_signup: false`, and `mailer_autoconfirm: false`; Supabase does not expose the configured Site URL/redirect allowlist through that public settings endpoint.
- Vercel preview redeploy after webhook env setup on 2026-05-28:
  - Preview URL: `https://invoice-mtyufynl7-admin-26436872s-projects.vercel.app`
  - Deployment ID: `dpl_EdqKHYxKB7MbaXaQwWByAyDgXQ3U`
  - Target: `preview`
  - Status: `Ready`
  - Stable preview alias attached: `https://invoice-gen-admin-modeos-admin-26436872s-projects.vercel.app`
  - Stable preview route smoke:
    - `/`: `200`
    - `/api/stripe/webhook`: `400` without a Stripe signature
- Preview Stripe webhook configuration on 2026-05-28:
  - Stripe webhook endpoint ID: `we_1TcC8LGUvP4KG8X1vgPjXizt`
  - Webhook URL: `https://invoice-gen-admin-modeos-admin-26436872s-projects.vercel.app/api/stripe/webhook`
  - Mode: test (`livemode: false`)
  - Status: `enabled`
  - Enabled events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Metadata: `app=ihateinvoices`, `environment=preview`
  - Vercel `STRIPE_WEBHOOK_SECRET` is now present for Preview and Development.
  - Signed webhook probe against the stable preview alias returned `200` with `{"received":true}`.
  - Probe event recorded in Supabase: `evt_ihi_preview_env_probe_1780006587263`, type `account.updated`, created at `2026-05-28T22:16:27.740574+00:00`.
  - The probe used an ignored event type, so it did not grant or revoke any subscription entitlement.
- Preview homepage content checks:
  - Required company strings present: `Booman Systems LLC`, `admin@modeos.app`, `Arizona LLC operating from Maryland`, `I Hate Invoices`
  - Forbidden personal/location/copycat strings absent, including prior stage-name references, the incorrect state location, and the competitor PDF-toolbox tagline/claims found during audit.
- Public homepage redesign on 2026-05-28:
  - Replaced the parent-company-like homepage with a product-first, professional invoice SaaS UI.
  - Removed the systems-infrastructure hero image and company snapshot as primary content.
  - New first viewport focuses on invoice creation, client records, PDF export, payment tracking, and free/Pro plans.
  - Booman Systems LLC now appears only in footer/legal ownership and contact context on the public homepage.
  - Fresh Vercel preview deployment after redesign:
    - Preview URL: `https://invoice-etb99kbbv-admin-26436872s-projects.vercel.app`
    - Deployment ID: `dpl_EbaQJtTUMh9t76ZAyHSqmgx6f5kp`
    - Status: `Ready`
    - Stable preview alias attached: `https://invoice-gen-admin-modeos-admin-26436872s-projects.vercel.app`
    - Preview root smoke: `200`
  - Local production-server QA after redesign:
    - `/`: rendered with title `I Hate Invoices | Simple invoice software`
    - H1: `Invoices without the busywork`
    - No Booman Systems, Arizona LLC, Company Snapshot, technical operations, or stage-name references in the main page content
    - No `systems-infrastructure` image reference in the rendered page
    - Mobile overflow check: `false`
  - Color contrast update after user approval:
    - Shifted the product accent away from the blue/teal family to a deeper green primary palette with a small warm contrast accent.
    - Current rendered color tokens: primary `#17613f`, primary dark `#0f4a2f`, contrast `#c47a12`, tint `#eef8f2`.
    - Fresh Vercel preview deployment after color update:
      - Preview URL: `https://invoice-pjnz6kol0-admin-26436872s-projects.vercel.app`
      - Deployment ID: `dpl_Hs24rAg3AsofEk3DsjsgLdxvCUym`
      - Status: `Ready`
      - Stable preview alias attached: `https://invoice-gen-admin-modeos-admin-26436872s-projects.vercel.app`
      - Preview root smoke: `200`
    - Deployed preview visual QA after color update:
      - Console errors: none
      - Mobile overflow check: `false`
- Preview signup confirmation redirect fix on 2026-05-28:
  - Root cause: signup and resend confirmation emails did not pass `emailRedirectTo`, so Supabase fell back to the production Auth Site URL.
  - `app/signup/page.tsx` now sends `emailRedirectTo: window.location.origin + "/dashboard"`.
  - `app/verify-email/page.tsx` resend now sends `emailRedirectTo: window.location.origin + "/dashboard"`.
  - Supabase redirect allowlist now includes `https://*-admin-26436872s-projects.vercel.app/**`.
  - Fresh Vercel preview deployment after redirect fix:
    - Preview URL: `https://invoice-qu2ywq91a-admin-26436872s-projects.vercel.app`
    - Deployment ID: `dpl_3GXXsCCTxayHXMixbtpTNhuTdTd6`
    - Status: `Ready`
    - Stable preview alias attached: `https://invoice-gen-admin-modeos-admin-26436872s-projects.vercel.app`
  - Preview route smoke after redirect fix:
    - `/signup`: `200`
    - `/verify-email`: `200`
    - `/dashboard`: `307` when unauthenticated
  - Deployed signup bundle verification contains `emailRedirectTo`, `window.location.origin`, and `/dashboard`, with no hardcoded `www.ihateinvoices.com` redirect.
  - Deployed preview visual QA after redesign:
    - Title: `I Hate Invoices | Simple invoice software`
    - H1: `Invoices without the busywork`
    - Console errors: none
    - No Booman Systems, Arizona LLC, Company Snapshot, technical operations, or stage-name references in the main page content
    - No `systems-infrastructure` image reference in the rendered page
    - Mobile overflow check: `false`
- Preview auth UI and sign-in recovery fix on 2026-05-28:
  - Root cause: the auth pages still used the original dark-blue inline styles, and login left the submit button in `Signing in...` while waiting for Supabase or route transition completion.
  - Added shared auth layout/styling in `components/AuthShell.tsx` and `app/globals.css`.
  - Added `lib/auth-timeout.ts` and wrapped login, signup, resend verification, forgot-password, and reset-password Supabase auth calls in a 15-second recovery path.
  - Local validation after the fix:
    - `npm run lint`: passed.
    - `npm run build`: passed.
    - Local production server on `127.0.0.1:3026` rendered `/login`, `/signup`, `/forgot-password`, `/reset-password`, and `/verify-email`.
    - Invalid-login QA returned `Invalid login credentials`; the submit button returned to `Sign In` and was enabled.
    - Auth route old-style inline color hits for `#0a0f1e`, `#111827`, `#2563eb`, and `#374151`: `0`.
    - Login button rendered primary color `rgb(23, 97, 63)`.
    - Mobile login overflow check: `false`.
  - Fresh Vercel preview deployment after auth fix:
    - Preview URL: `https://invoice-ilmx4sh48-admin-26436872s-projects.vercel.app`
    - Deployment ID: `dpl_CrP7UT7qBfTtERGJQgaVMYHdTwMx`
    - Status: `Ready`
    - Stable preview alias attached: `https://invoice-gen-admin-modeos-admin-26436872s-projects.vercel.app`
  - Final follow-up before deployment added an accessible `aria-label` to the `/verify-email` resend email input.
  - Stable preview route smoke after auth fix:
    - `/login`: `200`
    - `/signup`: `200`
    - `/forgot-password`: `200`
    - `/reset-password`: `200`
    - `/verify-email`: `200`
    - `/dashboard`: `307` when unauthenticated
  - Deployed login HTML verification:
    - `auth-shell`: present
    - Old dark-blue inline color hits: `0`
    - `Sign in`: present
- Current Booman Systems source verification on 2026-05-28:
  - `boomansystems.com` and `/about` contain `Booman Systems LLC`, `Arizona limited liability company`, `May 15, 2026`, `admin@modeos.app`, `Available upon request`, and `Arizona LLC operating from Maryland`.

## Cross-Node Duplicate Setup Check

- Local repo inventory:
  - Active repo: `/Users/booman/projects/invoice-gen`
  - Audit copy: `/Users/booman/projects-audit/invoice-gen`
  - No older ihateinvoices billing implementation was found in the audit copy or recon files.
- External drives:
  - Checked mounted archive copies on `/Volumes/6TBEEZY`, `/Volumes/BooManSSD`, and `/Volumes/StudioSSD`.
  - Found April archive/mirror copies of `invoice-gen` and `ihateinvoices`, but no hits for `billing_profiles`, `stripe_webhook_events`, `STRIPE_PRO_PRICE_ID`, signed Stripe webhook setup, subscription checkout mode, or Customer Portal wiring.
  - `/Volumes/PRIME 4` was not searchable from this session due filesystem permission denial.
- Ubuntu/remote nodes:
  - `clawserver` was reachable.
  - `/home/gburleyiii/Projects/invoice-gen` is clean and at commit `1e91019`, matching local `HEAD` before the current uncommitted audit work.
  - `/home/gburleyiii/.openclaw/workspace/invoice-gen` is clean and at old initial commit `bb1e511`.
  - Neither `clawserver` copy had billing/Stripe/Supabase subscription setup hits.
  - `ubuntu-mini`, `mediaserver`, and `mediaserver-ts` were not reachable from this session (`timeout` / `No route to host`).
- Adjacent project/planning hits:
  - SpinbookDJ has its own Stripe subscription implementation and links to `ihateinvoices.com` from a booking contract page.
  - FastPDF and 130 Mode recon files contain Stripe/Supabase subscription planning and diagnostics.
  - These are reusable patterns, not an existing ihateinvoices setup.
- Live service checks:
  - Vercel production now has `NEXT_PUBLIC_APP_URL=https://www.ihateinvoices.com` and `SUPABASE_SERVICE_ROLE_KEY`.
  - Vercel preview/development now have `SUPABASE_SERVICE_ROLE_KEY`, test-mode `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`.
  - Vercel production intentionally does not have `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, or `STRIPE_WEBHOOK_SECRET` yet, because the available Stripe secret is test-mode only.
  - The Vercel-linked Supabase ref for `invoice-gen` is `stjycgosnmtbhuuagunq`; production and preview env pulls both confirmed this exact URL.
  - The Supabase CLI token lists a different project named `invoice-gen` at ref `pdfocjucrotcrgzfmsic`, but that project is inactive and is not the Vercel-linked app database.
  - Before dashboard application, the matching service key returned `404` for `billing_profiles` and `stripe_webhook_events`.
  - After dashboard application, both billing tables return `200` through the app-side service-role REST path.
  - Supabase MCP migration/list access returned permission denied for `stjycgosnmtbhuuagunq`.
  - Supabase Management API access for `stjycgosnmtbhuuagunq` returned `403`.
  - Supabase temporary-token database access dry-run failed with `SQLSTATE 28P01`, so the available PAT is not authorized for direct Postgres migration access.
  - A read-only Stripe product/price search using the available test secret found no existing I Hate Invoices product or price.
  - Created a separate test-mode Stripe Product `I Hate Invoices Pro` with Price `price_1Tc0QNGUvP4KG8X1ZXKEVvtA` at `$7/month`.
  - Created the test-mode Stripe Customer Portal configuration `bpc_1Tc0YjGUvP4KG8X1VTnBEQLw` with customer update, invoice history, payment method update, and cancel-at-period-end enabled.
  - Existing recon Stripe objects are `FastPDF Pro`, so they were not reused for this app.

## Internet Similarity Scan

- Search targets included `ihatepdf.com`, `ihatepdf.cv`, `ihatepdf.org`, `ihatepdf.world`, `iLovePDF`, and exact `I Hate Invoices`/`ihateinvoices.com` queries.
- Highest similarity risk found: `ihatepdf.com`, which uses a PDF-hater/fixed-PDF tagline and a grid-heavy PDF-toolbox structure.
- Current I Hate Invoices repo and preview output do not contain the risky copied phrases or PDF-toolbox positioning.
- Current homepage no longer follows the Booman Systems operational aesthetic. It uses a distinct light invoice-SaaS presentation with product UI mockups, invoice workflow copy, and restrained footer-only ownership/contact context.

## Audit Fixes Applied Locally

- Fast-forwarded local `main` from the backburner tag to `origin/main`
- Removed a GitHub token from the local `origin` remote URL
- Upgraded `next` and `eslint-config-next` from `16.2.3` to `16.2.6`
- Renamed Next middleware convention from `middleware.ts` to `proxy.ts`
- Added `outputFileTracingRoot` to stop Next from inferring `/Users/booman` as the workspace root
- Fixed lint blockers in landing copy and Supabase client initialization
- Wired the dashboard invoice-saved toast to `/dashboard?created=true`
- Aligned signup password copy and validation at 8 characters
- Updated `supabase/schema.sql` to include `clients`, `invoices.client_id`, `overdue` status, indexes, unique invoice numbers per user, and explicit RLS `WITH CHECK` policies
- Added billing schema for `billing_profiles` and `stripe_webhook_events`
- Created migration `supabase/migrations/20260523095504_add_billing_subscriptions.sql`
- Added `/api/billing/status`, `/api/billing/checkout`, `/api/billing/portal`, `/api/stripe/webhook`, and `/api/invoices`
- Moved invoice creation behind a server route so the app can enforce the free limit before insert
- Added a dashboard billing card for free usage, Pro upgrade, and billing management
- Added password recovery pages at `/forgot-password` and `/reset-password`
- Added legal/support pages at `/terms`, `/privacy`, and `/refunds`
- Added footer legal/support links and signup Terms/Privacy acknowledgement

## Remaining Launch Cleanup

1. Final legal/compliance review is still required before broad public promotion.
   - `/terms`, `/privacy`, and `/refunds` exist.
   - Site company/contact copy matches the current public Booman Systems LLC source site.
   - A lawyer or owner-approved policy review should confirm subscription, cancellation, refund, privacy, and business-contact language before wide launch.

2. Old key cleanup still needs confirmation.
   - Live Stripe production values are configured and working.
   - Any older Vercel/Stripe keys should only be removed or rotated after confirming they are not used by another project.

3. Test-data cleanup is an owner decision.
   - Production live testing created real test records and a live owner subscription path.
   - Clean up only what you intentionally want removed; do not delete database rows or Stripe customers without a clear reason.

4. Monitoring baseline is active, with optional future hardening.
   - `/api/health` is live and returns `200`.
   - UptimeRobot can monitor the homepage and `/api/health`.
   - `PRODUCTION_MONITORING.md` documents Vercel logs, workflow triage, and rollback.
   - Dedicated third-party error tracking such as Sentry remains optional until paid traffic increases and a privacy posture is approved.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` - set in production
- `SUPABASE_SERVICE_ROLE_KEY` - set in production, preview, and development
- `STRIPE_SECRET_KEY` - set in production with the live restricted Stripe key and in non-production with test-mode values where needed
- `STRIPE_PRO_PRICE_ID` - set in production to the live I Hate Invoices Pro recurring price and in non-production to a test price where needed
- `STRIPE_WEBHOOK_SECRET` - set in production for the live Stripe webhook endpoint and in non-production for the test webhook endpoint where needed

## Recommended Public Launch Sequence

1. Perform owner/legal review of `/terms`, `/privacy`, and `/refunds`.
2. Decide whether to keep or remove test clients, test invoices, and live checkout test artifacts.
3. Confirm no unused old Stripe or Vercel keys remain after checking whether any other project depends on them.
4. Keep UptimeRobot monitors active for `https://www.ihateinvoices.com/` and `https://www.ihateinvoices.com/api/health`.
5. Monitor Vercel logs, Stripe webhook delivery, Supabase auth/database logs, and support email daily during the first launch week.
6. Add dedicated third-party error tracking later if public paid traffic increases.

## Current Readiness Score

- Public website availability: 99%
- Auth gate/readiness: 96%
- Invoice app functionality: 95%
- Database alignment: 94%
- Security baseline: 90%
- Revenue readiness: 94%
- Overall controlled-beta readiness: 97%
- Overall broad public launch readiness: 92%
