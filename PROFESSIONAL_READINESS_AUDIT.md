# Professional Readiness Audit Report

All file paths are under `/Users/booman/projects/invoice-gen` unless noted. `invoice-gen` is the repo/deployment implementation name; the product is **I Hate Invoices**.

## 1. Executive Summary

- Site name: I Hate Invoices
- What the site does: Small-business invoice creation, client records, saved PDF export, manual payment-status tracking, and Free-to-Pro subscription billing.
- Current estimated completion: 94% beta readiness; 70% production readiness.
- Beta readiness score: 94/100
- Production readiness score: 70/100
- Biggest strength: Current `main` is pushed, CI-passing, deployed to production, and route-smoke-tested on both `ihateinvoices.com` domains.
- Biggest weakness: Authenticated user flows and production Stripe env/live billing are not proven.
- Biggest launch blocker: Authenticated production QA and production Stripe env values are still missing.
- Overall recommendation: Internal testing only. Beta-ready after authenticated QA; public launch-ready after more fixes.

Validation completed in this pass: `npm run test:unit` passed, `npm run readiness` passed, `npm run lint` passed, `npm run typecheck` passed, `npm run build` passed, and a local production server on port `3028` returned `/` `200`, `/auth/callback` `200 -> /login`, `/terms` `200`, `/robots.txt` `200`, `/sitemap.xml` `200`, unauthenticated `/dashboard` `200 -> /login`, unauthenticated `/api/billing/status` `401`, unsigned `/api/stripe/webhook` `400`, and invalid-origin `/api/invoices` `403`. GitHub Actions passed after push. Live read-only checks confirmed `https://www.ihateinvoices.com/login` and `/signup` render the current light auth UI, `/auth/callback` redirects to `/login?auth_error=missing-code`, and `/dashboard` redirects to `/login?redirect=%2Fdashboard`. Authenticated protected-page visual QA still requires a real test user session.

## 2. Plain-English Site Description

I Hate Invoices lets a freelancer or small business owner create client records, build invoices, save them, download a professional PDF, and track whether each invoice is draft, sent, paid, or overdue. The business model is a free plan with a small monthly invoice limit and a Pro subscription for unlimited invoice creation.

## 3. Technical Site Description

The app is a Next.js App Router application deployed on Vercel. Supabase provides authentication, Postgres tables, row-level security, and SSR-compatible session cookies. Client pages read user-owned records through Supabase, while invoice creation and billing routes use server-side API routes. Stripe Checkout creates Pro subscriptions, Stripe webhooks sync subscription entitlement into `billing_profiles`, and React PDF renders saved invoice PDFs.

## 4. Complete Stack Inventory

See `STACK_INVENTORY.md`.

## 5. Route / Page Inventory

| Route | Purpose | Access | Data dependencies | Current condition | Problems | Required fixes |
|---|---|---|---|---|---|---|
| `/` | Marketing/pricing homepage | Public | `lib/company.ts` for contact link | Deployed and smoke-tested | Authenticated conversion flow untested | Browser QA. |
| `/login` | Sign in | Public | Supabase Auth | Builds; auth-error handling added; local light UI browser QA passed | Authenticated production QA still required | Deploy and test. |
| `/signup` | Account creation | Public | Supabase Auth | Builds; email verification now targets `/auth/callback?next=/dashboard` | Email verification QA required | Test real flow. |
| `/forgot-password` | Password reset request | Public | Supabase Auth email | Deployed and smoke-tested | Real email QA required | Test real reset. |
| `/reset-password` | Set new password | Public with Supabase recovery token | Supabase Auth | Local exists | QA required | Test real reset link. |
| `/verify-email` | Resend verification | Public | Supabase Auth | Resend now targets `/auth/callback?next=/dashboard` | QA required | Test real account. |
| `/auth/callback` | Supabase email confirmation callback | Public | Supabase Auth code exchange | Builds; smoke-covered missing-code redirect to `/login` | Real email confirmation still needs QA | Allowlist callback URL and test real email link. |
| `/terms` | Terms | Public | `lib/company.ts` | Deployed and smoke-tested | Missing legal depth | Founder/legal review. |
| `/privacy` | Privacy | Public | `lib/company.ts` | Deployed and smoke-tested | Needs final privacy/legal review | Founder/legal review. |
| `/refunds` | Refund/cancellation policy | Public | `lib/company.ts` | Deployed and smoke-tested | Stripe portal must be proven | Billing QA. |
| `/dashboard` | Billing summary and invoice list | Protected | Supabase invoices, `/api/billing/status` | Builds with current light app shell | Unbounded reads; mobile table; authenticated visual QA still required | Test after login; add pagination/tests. |
| `/clients` | Client list and create | Protected | Supabase clients/invoices | Builds with current light app shell | No edit/delete; unbounded counts; authenticated visual QA still required | Test after login; add CRUD/pagination later. |
| `/invoice/new` | Create invoice | Protected | Supabase clients, `/api/invoices` | Builds with current light app shell; unsaved PDF bypass fixed; hosted atomic RPC exists | Atomic quota is not live until the flag is enabled and QA passes | Enable and verify RPC path in controlled QA. |
| `/invoice/[id]` | Saved invoice detail/PDF/status | Protected | Supabase invoice | Builds with current light app shell and updated PDF accent color | No edit/delete; status update client-side; authenticated visual QA still required | Test after login; add server action/API later. |
| `/api/invoices` | Save invoices and enforce free limit | Auth API | Supabase billing, clients, invoices, optional `create_invoice_atomic` RPC | Builds; RPC path unit-tested and hosted migration applied | RPC flag remains off until authenticated QA | Enable flag in controlled QA, test invoice creation/concurrency. |
| `/api/billing/status` | Plan and usage status | Auth API | Supabase billing/invoices | Deployed; unauth smoke returns `401` | Authenticated status untested | Authenticated QA. |
| `/api/billing/checkout` | Stripe Checkout | Auth API | Supabase admin, Stripe | Deployed; unauth smoke returns `401` | Production Stripe env not configured | Add live env and test. |
| `/api/billing/portal` | Stripe Customer Portal | Auth API | Supabase admin, Stripe | Builds | Portal not production-proven | Configure and test. |
| `/api/stripe/webhook` | Stripe entitlement sync | Public Stripe-signed API | Stripe signature, Supabase admin | Deployed; unsigned smoke returns `400` | Production webhook secret missing; live duplicate replay not proven | Add live env and replay Stripe events. |
| Unknown route | Branded not-found page | Public | None | Deployed and smoke-tested | None for route smoke | Browser QA. |
| Global app error | Branded error boundary | Public/protected fallback | Runtime errors | Added locally | Needs browser fault injection later | Add E2E failure case. |
| `/robots.txt` | Crawl rules | Public | `NEXT_PUBLIC_APP_URL` | Deployed and smoke-tested | None for route smoke | Monitor indexing. |
| `/sitemap.xml` | Public sitemap | Public | `NEXT_PUBLIC_APP_URL` | Deployed and smoke-tested | Needs richer schema later | Monitor indexing. |

## 6. Feature Completion Matrix

| Feature | Status | Risk | What works | What does not work / missing |
|---|---|---|---|---|
| Public homepage | Mostly complete | Medium | Clear offer/pricing; deployed current source | Competitor differentiation must stay monitored. |
| Signup/login/logout | Mostly complete | High | Supabase auth, route protection, callback code exchange, and local public auth UI QA exist | Real email and authenticated production QA still required. |
| Password recovery | Partial | Medium | Pages exist locally | Production route and real email QA still required. |
| Client records | Partial | Medium | Create/list | Edit/delete/import/search missing. |
| Invoice creation | Mostly complete | High | Server API saves invoice; atomic RPC path prepared locally | Atomic quota/numbering not live-enabled until migration verification. |
| Saved PDF export | Mostly complete | Medium | Saved invoice PDF download | PDF chunk/performance improvements needed. |
| Dashboard | Partial | Medium | Stats/list/billing status UI and current light app shell | Unbounded reads; no search/filter/pagination; authenticated visual QA required. |
| Billing checkout | Partial | Critical | Stripe server routes are deployed | Production Stripe env not configured/proven. |
| Webhook entitlement | Partial | Critical | Signature verification, sync, atomic event claiming, and route deployment exist | Production webhook env and Stripe replay not proven. |
| Legal pages | Partial | Medium | Terms/privacy/refunds are deployed | Missing final policy depth/review. |
| Admin/operator | Missing | Low | Not required for MVP | No admin panel; support will be manual. |

## 7. Readiness Scorecard

| Category | Score | Grade | Evidence | Main fixes |
|---|---:|---|---|---|
| Product Functionality | 9/15 | Needs Work | Core routes and API exist | Edit/delete, send/payment links, full QA. |
| Code Quality / Architecture | 6.5/10 | Needs Work | Build/lint/typecheck/unit tests pass | Server-side data loading, broader tests, remove live drift. |
| Security | 9/15 | Needs Work | RLS, webhook signatures, server keys, atomic webhook event claim, enforced CSP baseline | Atomic invoice flag not live, preview CSP/browser QA, broader monitoring. |
| Authentication / Authorization | 5.8/8 | Needs Work | `proxy.ts`, Supabase SSR clients, `/auth/callback` code exchange | Deploy/test callback flow, add E2E auth tests. |
| Database / Data Integrity | 5.4/8 | Needs Work | RLS/schema exist; app-level input limits added; atomic invoice migration applied and RPC probe verified | Enable/verify RPC path, DB constraints, remaining indexes. |
| Payment / Financial Flow | 4.8/8 | Dangerous | Stripe routes are deployed; duplicate webhook claiming is unit-tested | Production Stripe env and paid-flow QA. |
| Error Handling / Reliability | 4.7/7 | Needs Work | Basic route errors plus branded 404/global error fallback | Safe logs, retries, deeper failure-mode E2E. |
| UX/UI / Responsive Design | 5.8/7 | Good | Coherent public/auth/app UI and protected-page restyling | Mobile tables/forms, first-run checklist, authenticated visual QA. |
| Accessibility | 3.6/5 | Needs Work | Skip link, labels improved, app shell focus styles | More keyboard/mobile/table audits. |
| Performance | 3/5 | Needs Work | Static public route, font optimized | PDF lazy load, pagination, server data. |
| SEO / Metadata / Social Sharing | 3/4 | Needs Work | Metadata/robots/sitemap deployed and smoke-tested | Add richer OG asset/schema. |
| Legal / Privacy / Compliance | 2.5/4 | Dangerous | Legal pages deployed | Policy expansion and final review. |
| Testing Coverage | 3/4 | Needs Work | Vitest unit tests for billing/env/invoice/security/Stripe webhook/billing/invoice route guardrails, duplicate webhook claiming, atomic invoice RPC flag path, plus signed webhook route fixture and auth-callback smoke | Add authenticated E2E/RLS tests, preview Stripe replay, protected visual QA, and live migration concurrency tests. |

Current beta-readiness percentage: 94%. Current production-readiness percentage: 70%. Confidence: high for code/build/CI/route-smoke findings, hosted migration presence, and public auth-page local browser QA; medium for authenticated Supabase/Stripe state because live authenticated flows and live Stripe are not fully proven in this pass.

## 8. Critical Blockers

1. Authenticated signup/login/invoice/PDF QA is still required after deploy.
2. Production Stripe live Product/Price/webhook/portal env is not configured/proven.
3. Free invoice quota and invoice numbering have a hosted atomic path, but it is not live-enabled.
4. No automated auth/RLS/E2E tests; unit tests now cover pure helper, API wrapper, Stripe webhook helper, signed webhook route fixture, and guardrail logic only.
5. Legal pages are live but still need final policy review/depth.
6. Production paid flow has not been exercised with owner approval.
7. No monitoring/error tracking/uptime alerts.
8. CSP browser QA and broader production abuse monitoring are not fully tested.
9. Authenticated preview QA still required.
10. Supabase Auth dashboard redirect allowlist must include the deployed `/auth/callback` URL before production email confirmation QA.

## 9. Security Findings

See `SECURITY_AUDIT.md`.

## 10. Legal / Compliance Findings

Basic legal pages are deployed at `/terms`, `/privacy`, and `/refunds`. Missing or weak items before public launch: accessibility statement, deeper account deletion SLA, final GDPR/CCPA rights review, tax/sales-tax language, failed-payment handling, price-change language, and stronger subscription renewal/cancellation disclosure.

## 11. Payment / Revenue Flow Findings

Stripe Checkout, Customer Portal, and webhook code are deployed. The webhook verifies signatures, atomically claims Stripe event IDs before entitlement sync, releases the claim on sync failure, and updates `billing_profiles`. The flow is not launch-complete because Vercel Production does not list `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, or `STRIPE_WEBHOOK_SECRET`, duplicate webhook replay has not been tested against real Stripe delivery, refunds/cancellations/failed payments are not fully QA-tested, and production paid flow has not been exercised with owner approval.

## 12. Database / Data Findings

Tables in source and hosted project: `clients`, `invoices`, `billing_profiles`, `stripe_webhook_events`, and `invoice_counters`. RLS is enabled in source. Basic app-level input limits now exist for invoice creation and matching UI fields. The migrations through `supabase/migrations/20260529121916_grant_create_invoice_atomic.sql` are applied to the linked hosted project; REST returns `HTTP 200` for `invoice_counters`, and an unauthenticated RPC probe returns `403 Unauthorized`. Stripe webhook event claiming now uses the existing `stripe_webhook_events` primary key before entitlement sync. Key gaps remain: fallback invoice creation remains count-based while `INVOICE_CREATE_RPC_ENABLED` is off, authenticated RPC/concurrency QA is still required before enabling the flag, invoice totals and string lengths still need DB constraints, and composite indexes/ownership constraints still need a deeper migration pass.

Required migrations need approval before live application.

## 13. UX/UI Findings

Founder-level notes: the product is understandable and much more professional than the old cloned look. The auth pages and protected app pages now use the same light product direction instead of the retired dark-blue screen. Users may still see friction around what happens after signup, why they must save before PDF download, how billing updates after checkout, and what to do when they hit the free limit. Dashboard and client tables need mobile improvements before a broad beta.

## 14. Accessibility Findings

Accessibility score: 73/100 after safe fixes. Improvements made include visible focus styling, alert/status roles, table header scopes, form labeling improvements, app shell focus states, and removing nested button-in-link PDF markup on saved invoices. Remaining blockers: full keyboard QA, mobile table alternatives, form-level error descriptions, and accessibility statement.

## 15. Performance Findings

Public pages should perform well once deployed because the homepage is static and uses `next/font`. Authenticated pages risk lower mobile scores because of duplicated auth checks, client-side data loading, unbounded dashboard/client reads, and React PDF chunk loading. Add pagination, selected columns, server-side aggregation, and on-click PDF generation/server PDF route later.

## 16. Error Handling / Reliability Findings

| Failure scenario | Current behavior | Desired behavior | Risk | Fix required | File path |
|---|---|---|---|---|---|
| Bad login | Auth page shows error | Same, with E2E coverage | Medium | Test | `app/login/page.tsx` |
| Auth session missing | Proxy redirects | Same | Medium | Deploy/test cookie and callback fix | `proxy.ts`, `lib/supabase.ts`, `app/auth/callback/route.ts` |
| Billing API missing env | Server error | Safe user message plus server log | High | Env validation/runbook | `lib/server-env.ts` |
| Stripe webhook duplicate | Atomic event claim in local source | Same, plus preview/live Stripe replay | Medium | Deploy and replay duplicate events | `lib/stripe-webhook.ts`, `app/api/stripe/webhook/route.ts` |
| Free limit reached | 402 + upgrade path | Same, tested | Medium | E2E test | `app/api/invoices/route.ts` |
| Network failure on dashboard | Partial silent failures | Clear retry/error UI | Medium | Add retry states | `app/dashboard/page.tsx` |
| Missing route | Branded 404 fallback | Same, smoke-covered | Low | Deploy and preview smoke | `app/not-found.tsx`, `scripts/smoke-local.mjs` |
| Runtime app error | Branded error boundary | Same, with future fault-injection E2E | Medium | Add browser failure test later | `app/error.tsx` |
| Missing invoice | Redirect dashboard | Invoice-specific not-found message | Low | Consider route-specific not-found later | `app/invoice/[id]/page.tsx` |

## 17. Testing Findings

Vitest unit tests now cover pure billing/env helpers, billing route response/session builders, invoice validation, request-security helpers, Stripe webhook processing helpers including duplicate event claiming and claim release on sync failure, a signed Stripe webhook route fixture, billing API route wrappers, invoice API route wrappers including the feature-flagged atomic RPC path, and the static readiness guard. Smoke and readiness scripts cover public routes, `/auth/callback`, protected redirects, selected unauthenticated API behavior, blocked stale copy, required files, security headers, and saved-only PDF export guardrails. Missing: authenticated browser E2E, Supabase RLS/cross-user tests, accessibility tests, visual regression tests, live atomic migration concurrency tests, and Stripe CLI replay on preview/live. See `QA_TEST_PLAN.md`.

## 18. DevOps / Deployment Findings

Deployment readiness: 85/100. Local lint, typecheck, build, and smoke checks pass. GitHub Actions CI passes on `main`, Vercel production deploy is Ready, and both `ihateinvoices.com` domains pass route smoke. Remaining gaps are authenticated manual QA of protected pages, production Stripe env/live billing verification, rollback rehearsal, and monitoring.

## 19. SEO / Brand Findings

Added metadata, Open Graph/Twitter summary, robots, and sitemap. Production sitemap/canonical now point to `https://www.ihateinvoices.com`. Public launch still needs a richer OG image and structured software/product schema. Search found a similar product at `https://www.ihateinvoicing.io/about`; keep I Hate Invoices visually and verbally distinct by emphasizing structured invoice workspace, saved-record PDF export, client records, and simple status tracking rather than AI chat-based invoicing.

## 20. AI-Code Cleanup Findings

Issues found and partly resolved: formerly unpushed critical files, stock README, missing env example, previously absent tests, duplicated status config, client-side data loading where server-side would be cleaner, stale deployment, no admin/operator tooling, and generated-looking mockup classes. No `DJ Booman`, `Wyoming`, `InvoiceGen`, or `opinionated` product copy was found in source search.

## 21. Fixes Implemented

| File | Change | Why it matters | How to test |
|---|---|---|---|
| `lib/supabase.ts` | Switched browser client to `createBrowserClient` | Fixes SSR auth cookie/login-loop risk | Login then reach `/dashboard`. |
| `app/invoice/new/page.tsx` | Removed unsaved PDF download; save required first | Closes free-quota PDF bypass | Try to download before saving; not available. |
| `app/invoice/[id]/page.tsx` | PDF link no longer nests a button; status update adds `user_id`; table scopes/labels | Improves accessibility and defense in depth | Open saved invoice and download PDF. |
| `app/dashboard/page.tsx` | Real links in invoice table, status/alert roles, table scopes | Keyboard/accessibility improvement | Tab through invoice table. |
| `app/clients/page.tsx` | Form labels, alert/status roles, table scopes | Accessibility improvement | Submit empty form and inspect focus/screen reader cues. |
| `lib/server-env.ts` | Production base URL now fails closed if missing | Prevents Stripe return URL drift | Missing prod app URL should error server-side. |
| `next.config.ts` | Added baseline security headers | Reduces common browser risk | Check response headers after deploy. |
| `app/api/invoices/route.ts` | Added client, invoice, note, line-item, amount, and date limits | Reduces storage abuse and PDF-rendering abuse risk | Submit oversized invoice payloads; API should return `400`. |
| `app/invoice/new/page.tsx`, `app/clients/page.tsx` | Added matching form limits for common fields | Gives users earlier feedback before server rejection | Try entering oversized field values. |
| `app/layout.tsx` | Added canonical, OG, Twitter metadata | Improves sharing/search baseline | View page metadata. |
| `app/robots.ts`, `app/sitemap.ts` | Added crawl controls and sitemap | SEO/readiness baseline | Visit `/robots.txt`, `/sitemap.xml`. |
| `package.json` | Added `typecheck` and `verify` scripts | Gives repeatable validation commands | Run `npm run verify`. |
| Docs | Added README, env template, launch/security/QA/stack/punch-list/report docs | Owner/developer handoff | Open docs in repo. |
| `supabase/migrations/20260529090606_atomic_invoice_create.sql`, `supabase/migrations/20260529121916_grant_create_invoice_atomic.sql`, `supabase/schema.sql` | Added and applied hosted `invoice_counters` table and `create_invoice_atomic` RPC | Creates the DB-side path needed for atomic quota checks and invoice numbering | Enable the flag only during controlled authenticated QA, then test concurrent invoice creates. |
| `app/api/invoices/route.ts`, `.env.example` | Added `INVOICE_CREATE_RPC_ENABLED` feature flag and RPC integration path | Lets the app keep the known fallback until authenticated migration QA is complete | Keep flag unset/false; enable only after authenticated QA. |
| `tests/invoices-api-route.test.ts` | Added route-wrapper tests for the atomic RPC success and free-limit error paths | Protects the feature-flagged integration from regressions | Run `npm run test:unit`. |
| `lib/stripe-webhook.ts` | Claims Stripe event IDs before entitlement sync and releases the claim on sync failure | Removes the local check-then-insert duplicate webhook race | Run duplicate webhook unit tests and Stripe replay in preview. |
| `tests/stripe-webhook.test.ts`, `tests/stripe-webhook-route.test.ts` | Added duplicate-claim and claim-release coverage | Proves duplicate event delivery does not sync entitlement twice in local tests | Run `npm run test:unit -- tests/stripe-webhook.test.ts tests/stripe-webhook-route.test.ts`. |
| `app/not-found.tsx`, `app/error.tsx`, `app/globals.css`, `scripts/smoke-local.mjs` | Added branded 404/global error fallbacks and smoke coverage for unknown routes | Replaces default framework failure pages with professional recovery paths | Run `npm run smoke` and visit an unknown URL. |
| `next.config.ts`, `scripts/smoke-local.mjs` | Added enforced CSP baseline and smoke header assertion | Reduces XSS/frame/object/plugin blast radius and makes the policy deploy-checkable | Run `npm run smoke`; browser-test auth/PDF/Stripe flows on preview. |
| GitHub/Vercel | Pushed current `main`, fixed CI lock/test issues, verified CI pass, and smoke-tested Vercel production plus both custom domains | Removes stale-production blocker and proves route availability | Review GitHub Actions run `26635694962` and production smoke output. |
| `app/auth/callback/route.ts`, `app/signup/page.tsx`, `app/verify-email/page.tsx`, `app/login/page.tsx`, `scripts/smoke-local.mjs` | Added a Supabase auth callback route, moved signup/resend email redirects through it, and smoke-covered the missing-code redirect | Prevents email confirmation links from landing directly on a protected route before SSR cookies are exchanged | Run `npm run smoke`; perform real signup/email confirmation QA. |
| `components/AppPageShell.tsx`, `app/dashboard/page.tsx`, `app/clients/page.tsx`, `app/invoice/new/page.tsx`, `app/invoice/[id]/page.tsx`, `app/globals.css` | Reworked protected app pages onto a shared light product shell | Removes the retired dark-blue protected-page styling that made sign-in appear to return to the old app | Log in and inspect dashboard, clients, new invoice, and saved invoice pages. |
| `components/PDFTemplate.tsx` | Changed the PDF accent from old blue to the current green product accent | Keeps exported invoices aligned with the refreshed app styling | Download a saved invoice PDF. |
| `app/login/page.tsx` | Changed successful sign-in from client-side route replacement to full document navigation | Prevents an already-open old client bundle from carrying the user into a stale protected dashboard after login | Sign in from `/login`; the browser should load the current production `/dashboard` document. |

## 22. Fixes Not Implemented Yet

| Task | Reason not implemented | Risk | Required action |
|---|---|---|---|
| Atomic quota/invoice numbering flag enablement | Hosted migration is applied, but the deployed app still uses fallback until the feature flag is enabled | High | Enable `INVOICE_CREATE_RPC_ENABLED=true` in controlled QA, test invoice create and concurrency, then promote deliberately. |
| Live Stripe setup | Requires owner approval for real money | Critical | Configure live Stripe and run controlled live test. |
| Authenticated E2E/API/RLS tests | Requires browser/database/test-user setup | High | Add Playwright/API/RLS tests in a later phase. |
| CSP browser QA | CSP header is implemented locally, but auth/PDF/Stripe browser flows must be checked on preview | Medium | Run preview browser QA with devtools open and adjust policy if any required flow is blocked. |
| Authenticated protected-page production QA | Source sweep is fixed locally, but a real signed-in production session is still required to prove deploy/cache/domain behavior | High | Test login after deploy and confirm dashboard, clients, new invoice, saved invoice detail, and PDF output use the current light product styling. |
| Monitoring | Requires service choice/account | Medium | Pick Sentry/PostHog/Uptime provider. |

## 23. Path to 100% Completion

### Must Fix Before Beta

| Priority | File/area | Difficulty | Business impact | Technical risk | Estimated effort | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Auth/invoice QA | Medium | High | Medium | 2 hrs | Test user completes signup through `/auth/callback`, lands on current light dashboard, creates an invoice, and downloads the saved PDF. |
| P0 | DB quota/numbering | Medium | High | High | 1-2 hrs | RPC flag is enabled after authenticated QA proves concurrent creates cannot bypass quota/numbering. |
| P1 | Legal copy depth | Medium | High | Medium | 2-4 hrs | Founder-approved beta legal pages live. |
| P1 | E2E smoke | Medium | High | Medium | 4-6 hrs | Auth/invoice/free-limit tests automated. |

### Must Fix Before Public Launch

| Priority | File/area | Difficulty | Business impact | Technical risk | Estimated effort | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Stripe live | Medium | Critical | High | 2-4 hrs | Live checkout/webhook/portal/cancel verified. |
| P0 | Production Stripe env | Medium | Critical | High | 1-2 hrs | Production has live Stripe secret, Pro price ID, webhook secret, and portal configuration. |
| P1 | Security hardening | Medium | High | Medium | 3-6 hrs | Rate limit/origin/CSP stay active after preview browser QA and production monitoring is configured. |
| P1 | Monitoring | Medium | High | Low | 2-4 hrs | Errors and uptime notify owner. |
| P1 | RLS/API tests | Medium | High | Medium | 4-8 hrs | Cross-user access denied in automated tests. |

### Should Fix Soon After Launch

Client/invoice edit/delete, mobile table cards, search/filter/sort, first-run checklist, account deletion/export, analytics.

### Future Version / Growth Features

Online invoice payments, recurring invoices, overdue reminders, multi-currency/tax profiles, team accounts, CSV import/export.

## 24. Exact Commands to Run

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run verify
npm run smoke
npm audit --audit-level=low
npm ls --depth=0
rg -n "TODO|FIXME|console\\.log|debugger|service_role|sk_|pk_|DJ Booman|Wyoming|InvoiceGen|opinionated" -g '!node_modules' -g '!.next'
```

Future after test tooling:

```bash
npm test
npm run test:e2e
npm run test:a11y
```

Local dev:

```bash
npm run dev -- -p 3027
```

Production preview:

```bash
npm run build
npm run start
```

## 25. Final Recommendation

This site is not beta-ready today until authenticated production QA passes. It is not production-ready for paid launch. Current score: 94/100 beta readiness, 70/100 production readiness.

Next action: run authenticated production QA to prove sign-in reaches the current light dashboard and protected pages, then configure live Production Stripe env before any paid launch.
