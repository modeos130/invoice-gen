# Professional Readiness Audit Report

All file paths are under `/Users/booman/projects/invoice-gen` unless noted. `invoice-gen` is the repo/deployment implementation name; the product is **I Hate Invoices**.

## 1. Executive Summary

- Site name: I Hate Invoices
- What the site does: Small-business invoice creation, client records, saved PDF export, manual payment-status tracking, and Free-to-Pro subscription billing.
- Current estimated completion: 87% beta readiness; 62% production readiness.
- Beta readiness score: 87/100
- Production readiness score: 62/100
- Biggest strength: Coherent lightweight MVP with real auth, client/invoice data, saved PDFs, and Stripe billing routes in local source.
- Biggest weakness: Local source and live production are not the same; production currently returns `404` for current legal and billing routes.
- Biggest launch blocker: Current launch-critical files are untracked/undeployed, so production cannot prove legal pages, billing APIs, or Stripe webhooks.
- Overall recommendation: Internal testing only. Beta-ready after fixes; public launch-ready after more fixes.

Validation completed in this pass: `npm run test:unit` passed, `npm run readiness` passed, `npm run lint` passed, `npm run typecheck` passed, `npm run build` passed, and a local production server on port `3028` returned `/` `200`, `/terms` `200`, `/robots.txt` `200`, `/sitemap.xml` `200`, unauthenticated `/api/billing/status` `401`, unsigned `/api/stripe/webhook` `400`, and invalid-origin `/api/invoices` `403`.

## 2. Plain-English Site Description

I Hate Invoices lets a freelancer or small business owner create client records, build invoices, save them, download a professional PDF, and track whether each invoice is draft, sent, paid, or overdue. The business model is a free plan with a small monthly invoice limit and a Pro subscription for unlimited invoice creation.

## 3. Technical Site Description

The app is a Next.js App Router application deployed on Vercel. Supabase provides authentication, Postgres tables, row-level security, and SSR-compatible session cookies. Client pages read user-owned records through Supabase, while invoice creation and billing routes use server-side API routes. Stripe Checkout creates Pro subscriptions, Stripe webhooks sync subscription entitlement into `billing_profiles`, and React PDF renders saved invoice PDFs.

## 4. Complete Stack Inventory

See `STACK_INVENTORY.md`.

## 5. Route / Page Inventory

| Route | Purpose | Access | Data dependencies | Current condition | Problems | Required fixes |
|---|---|---|---|---|---|---|
| `/` | Marketing/pricing homepage | Public | `lib/company.ts` for contact link | Builds | Live may be stale vs local | Deploy current source. |
| `/login` | Sign in | Public | Supabase Auth | Builds; cookie client fixed locally | Auth QA still required | Deploy and test. |
| `/signup` | Account creation | Public | Supabase Auth | Builds | Email verification QA required | Test real flow. |
| `/forgot-password` | Password reset request | Public | Supabase Auth email | Local exists | Production 404 until deployed | Deploy/test. |
| `/reset-password` | Set new password | Public with Supabase recovery token | Supabase Auth | Local exists | QA required | Test real reset link. |
| `/verify-email` | Resend verification | Public | Supabase Auth | Local exists | QA required | Test real account. |
| `/terms` | Terms | Public | `lib/company.ts` | Local exists | Production 404; missing legal depth | Deploy and improve. |
| `/privacy` | Privacy | Public | `lib/company.ts` | Local exists | Production 404; missing retention/GDPR/CCPA/cookie depth | Deploy and improve. |
| `/refunds` | Refund/cancellation policy | Public | `lib/company.ts` | Local exists | Production 404; Stripe portal must be proven | Deploy and improve. |
| `/dashboard` | Billing summary and invoice list | Protected | Supabase invoices, `/api/billing/status` | Builds | Unbounded reads; mobile table; live API drift | Add pagination/tests. |
| `/clients` | Client list and create | Protected | Supabase clients/invoices | Builds | No edit/delete; unbounded counts | Add CRUD/pagination later. |
| `/invoice/new` | Create invoice | Protected | Supabase clients, `/api/invoices` | Builds; unsaved PDF bypass fixed; feature-flagged atomic RPC prepared | Atomic quota is not live until migration is applied and flag enabled | Apply and verify DB migration/RPC. |
| `/invoice/[id]` | Saved invoice detail/PDF/status | Protected | Supabase invoice | Builds | No edit/delete; status update client-side | Add server action/API later. |
| `/api/invoices` | Save invoices and enforce free limit | Auth API | Supabase billing, clients, invoices, optional `create_invoice_atomic` RPC | Builds; RPC path unit-tested behind `INVOICE_CREATE_RPC_ENABLED` | Hosted DB migration not applied/verified | Apply migration, enable flag, test concurrency. |
| `/api/billing/status` | Plan and usage status | Auth API | Supabase billing/invoices | Builds | Production 404 | Deploy. |
| `/api/billing/checkout` | Stripe Checkout | Auth API | Supabase admin, Stripe | Builds | Live env not configured | Configure and test. |
| `/api/billing/portal` | Stripe Customer Portal | Auth API | Supabase admin, Stripe | Builds | Portal not production-proven | Configure and test. |
| `/api/stripe/webhook` | Stripe entitlement sync | Public Stripe-signed API | Stripe signature, Supabase admin | Builds; event claim is atomic in local source | Production 404; live duplicate replay not proven | Deploy and replay Stripe events. |
| Unknown route | Branded not-found page | Public | None | Added and smoke-covered locally | Must deploy | Smoke preview. |
| Global app error | Branded error boundary | Public/protected fallback | Runtime errors | Added locally | Needs browser fault injection later | Add E2E failure case. |
| `/robots.txt` | Crawl rules | Public | `NEXT_PUBLIC_APP_URL` | Added | Must deploy | Smoke. |
| `/sitemap.xml` | Public sitemap | Public | `NEXT_PUBLIC_APP_URL` | Added | Must deploy | Smoke. |

## 6. Feature Completion Matrix

| Feature | Status | Risk | What works | What does not work / missing |
|---|---|---|---|---|
| Public homepage | Mostly complete | Medium | Clear offer/pricing | Live stale; competitor differentiation must stay monitored. |
| Signup/login/logout | Mostly complete | High | Supabase auth and route protection exist | Auth cookie fix is local until deployed/tested. |
| Password recovery | Partial | Medium | Pages exist locally | Production route and real email QA still required. |
| Client records | Partial | Medium | Create/list | Edit/delete/import/search missing. |
| Invoice creation | Mostly complete | High | Server API saves invoice; atomic RPC path prepared locally | Atomic quota/numbering not live-enabled until migration verification. |
| Saved PDF export | Mostly complete | Medium | Saved invoice PDF download | PDF chunk/performance improvements needed. |
| Dashboard | Partial | Medium | Stats/list/billing status UI | Unbounded reads; no search/filter/pagination. |
| Billing checkout | Partial | Critical | Stripe server routes exist | Production Stripe not configured/proven. |
| Webhook entitlement | Partial | Critical | Signature verification, sync, and local atomic event claiming exist | Production route 404; live Stripe replay not proven. |
| Legal pages | Partial | High | Local terms/privacy/refunds | Production 404; missing policy depth. |
| Admin/operator | Missing | Low | Not required for MVP | No admin panel; support will be manual. |

## 7. Readiness Scorecard

| Category | Score | Grade | Evidence | Main fixes |
|---|---:|---|---|---|
| Product Functionality | 9/15 | Needs Work | Core routes and API exist | Edit/delete, send/payment links, full QA. |
| Code Quality / Architecture | 6.5/10 | Needs Work | Build/lint/typecheck/unit tests pass | Server-side data loading, broader tests, remove live drift. |
| Security | 8.5/15 | Needs Work | RLS, webhook signatures, server keys, atomic webhook event claim | Atomic invoice flag not live, CSRF/rate limits, CSP. |
| Authentication / Authorization | 5/8 | Needs Work | `proxy.ts`, Supabase SSR clients | Deploy cookie fix, add E2E auth tests. |
| Database / Data Integrity | 4.8/8 | Dangerous | RLS/schema exist; app-level input limits added; atomic invoice migration prepared | Apply/verify RPC migration, DB constraints, remaining indexes. |
| Payment / Financial Flow | 4.3/8 | Dangerous | Stripe routes exist; duplicate webhook claiming is unit-tested | Live Stripe config, paid-flow QA, and production deploy. |
| Error Handling / Reliability | 4.7/7 | Needs Work | Basic route errors plus branded 404/global error fallback | Safe logs, retries, deeper failure-mode E2E. |
| UX/UI / Responsive Design | 5/7 | Good | Coherent public/auth/app UI | Mobile tables/forms, first-run checklist. |
| Accessibility | 3.5/5 | Needs Work | Skip link, labels improved | More keyboard/mobile/table audits. |
| Performance | 3/5 | Needs Work | Static public route, font optimized | PDF lazy load, pagination, server data. |
| SEO / Metadata / Social Sharing | 2.5/4 | Needs Work | Metadata/robots/sitemap added | Deploy and add richer OG asset/schema. |
| Legal / Privacy / Compliance | 2/4 | Dangerous | Local pages exist | Production deploy and policy expansion. |
| Testing Coverage | 2.9/4 | Needs Work | Vitest unit tests for billing/env/invoice/security/Stripe webhook/billing/invoice route guardrails, duplicate webhook claiming, atomic invoice RPC flag path, plus signed webhook route fixture | Add authenticated E2E/RLS tests, preview Stripe replay, and live migration concurrency tests. |

Current beta-readiness percentage: 87%. Current production-readiness percentage: 62%. Confidence: high for local code/build/test findings; medium for live Supabase/Stripe state because hosted database and live Stripe are not fully proven in this pass.

## 8. Critical Blockers

1. Production returns `404` for current billing/legal routes.
2. Launch-critical files are untracked and unreproducible from Git.
3. Production Stripe live Product/Price/webhook/portal not configured/proven.
4. Supabase production migration state must be verified.
5. Free invoice quota and invoice numbering have a prepared atomic path, but it is not applied or live-enabled.
6. No automated auth/RLS/E2E tests; unit tests now cover pure helper, API wrapper, Stripe webhook helper, signed webhook route fixture, and guardrail logic only.
7. Legal pages are not live and missing policy depth.
8. No monitoring/error tracking/uptime alerts.
9. CSP and broader production abuse monitoring are not fully tested.
10. Authenticated preview QA still required.

## 9. Security Findings

See `SECURITY_AUDIT.md`.

## 10. Legal / Compliance Findings

Basic legal pages exist locally, but production returns `404` for `/terms`, `/privacy`, and `/refunds`. Missing or weak items before public launch: cookie/session disclosure, data retention, account deletion SLA, minors restriction, GDPR/CCPA rights, accessibility statement, tax/sales-tax language, failed-payment handling, price-change language, and stronger subscription renewal/cancellation disclosure.

## 11. Payment / Revenue Flow Findings

Stripe Checkout, Customer Portal, and webhook code exist locally. The webhook verifies signatures, atomically claims Stripe event IDs before entitlement sync, releases the claim on sync failure, and updates `billing_profiles`. The flow is not launch-complete because production billing routes return `404`, live Stripe env values are not configured/proven, duplicate webhook replay has not been tested against preview/live Stripe delivery, refunds/cancellations/failed payments are not fully QA-tested, and production paid flow has not been exercised with owner approval.

## 12. Database / Data Findings

Tables: `clients`, `invoices`, `billing_profiles`, `stripe_webhook_events`, and prepared `invoice_counters`. RLS is enabled. Basic app-level input limits now exist for invoice creation and matching UI fields. The migration `supabase/migrations/20260529090606_atomic_invoice_create.sql` prepares a per-user counter and `create_invoice_atomic` RPC, and `/api/invoices` can use it behind `INVOICE_CREATE_RPC_ENABLED=true`. Stripe webhook event claiming now uses the existing `stripe_webhook_events` primary key before entitlement sync. Key gaps remain: the hosted database has not applied or verified the atomic invoice migration, fallback invoice creation remains count-based while the flag is off, invoice totals and string lengths still need DB constraints, and composite indexes/ownership constraints still need a deeper migration pass.

Required migrations need approval before live application.

## 13. UX/UI Findings

Founder-level notes: the product is understandable and much more professional than the old cloned look, but users may still see friction around what happens after signup, why they must save before PDF download, how billing updates after checkout, and what to do when they hit the free limit. Dashboard and client tables need mobile improvements before a broad beta.

## 14. Accessibility Findings

Accessibility score: 72/100 after safe fixes. Improvements made include visible focus styling, alert/status roles, table header scopes, form labeling improvements, and removing nested button-in-link PDF markup on saved invoices. Remaining blockers: full keyboard QA, mobile table alternatives, form-level error descriptions, and accessibility statement.

## 15. Performance Findings

Public pages should perform well once deployed because the homepage is static and uses `next/font`. Authenticated pages risk lower mobile scores because of duplicated auth checks, client-side data loading, unbounded dashboard/client reads, and React PDF chunk loading. Add pagination, selected columns, server-side aggregation, and on-click PDF generation/server PDF route later.

## 16. Error Handling / Reliability Findings

| Failure scenario | Current behavior | Desired behavior | Risk | Fix required | File path |
|---|---|---|---|---|---|
| Bad login | Auth page shows error | Same, with E2E coverage | Medium | Test | `app/login/page.tsx` |
| Auth session missing | Proxy redirects | Same | Medium | Deploy cookie fix | `proxy.ts`, `lib/supabase.ts` |
| Billing API missing env | Server error | Safe user message plus server log | High | Env validation/runbook | `lib/server-env.ts` |
| Stripe webhook duplicate | Atomic event claim in local source | Same, plus preview/live Stripe replay | Medium | Deploy and replay duplicate events | `lib/stripe-webhook.ts`, `app/api/stripe/webhook/route.ts` |
| Free limit reached | 402 + upgrade path | Same, tested | Medium | E2E test | `app/api/invoices/route.ts` |
| Network failure on dashboard | Partial silent failures | Clear retry/error UI | Medium | Add retry states | `app/dashboard/page.tsx` |
| Missing route | Branded 404 fallback | Same, smoke-covered | Low | Deploy and preview smoke | `app/not-found.tsx`, `scripts/smoke-local.mjs` |
| Runtime app error | Branded error boundary | Same, with future fault-injection E2E | Medium | Add browser failure test later | `app/error.tsx` |
| Missing invoice | Redirect dashboard | Invoice-specific not-found message | Low | Consider route-specific not-found later | `app/invoice/[id]/page.tsx` |

## 17. Testing Findings

Vitest unit tests now cover pure billing/env helpers, billing route response/session builders, invoice validation, request-security helpers, Stripe webhook processing helpers including duplicate event claiming and claim release on sync failure, a signed Stripe webhook route fixture, billing API route wrappers, invoice API route wrappers including the feature-flagged atomic RPC path, and the static readiness guard. Smoke and readiness scripts cover public routes, protected redirects, selected unauthenticated API behavior, blocked stale copy, required files, security headers, and saved-only PDF export guardrails. Missing: authenticated browser E2E, Supabase RLS/cross-user tests, accessibility tests, visual regression tests, live atomic migration concurrency tests, and Stripe CLI replay on preview/live. See `QA_TEST_PLAN.md`.

## 18. DevOps / Deployment Findings

Deployment readiness: 68/100. Local lint, typecheck, build, and smoke checks pass. Vercel config exists, and CI now runs install, verify, production start, and smoke checks for pushes to `main` and pull requests. Remaining gaps are production deploy approval, live environment verification, authenticated manual QA, rollback rehearsal, monitoring, and proof that production is no longer stale versus local source.

## 19. SEO / Brand Findings

Added metadata, Open Graph/Twitter summary, robots, and sitemap. Public launch still needs a richer OG image, structured software/product schema, canonical verification after deploy, and production legal route availability. Search found a similar product at `https://www.ihateinvoicing.io/about`; keep I Hate Invoices visually and verbally distinct by emphasizing structured invoice workspace, saved-record PDF export, client records, and simple status tracking rather than AI chat-based invoicing.

## 20. AI-Code Cleanup Findings

Issues found: untracked critical files before release stabilization, stock README before this pass, missing env example before this pass, previously absent tests, duplicated status config, client-side data loading where server-side would be cleaner, stale deployment, no admin/operator tooling, and generated-looking mockup classes. No `DJ Booman`, `Wyoming`, `InvoiceGen`, or `opinionated` product copy was found in source search.

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
| `supabase/migrations/20260529090606_atomic_invoice_create.sql`, `supabase/schema.sql` | Added prepared `invoice_counters` table and `create_invoice_atomic` RPC | Creates the DB-side path needed for atomic quota checks and invoice numbering | Apply to preview Supabase, then test concurrent invoice creates. |
| `app/api/invoices/route.ts`, `.env.example` | Added `INVOICE_CREATE_RPC_ENABLED` feature flag and RPC integration path | Lets the app keep the known fallback until the hosted migration is verified | Keep flag `false`; enable only after migration QA. |
| `tests/invoices-api-route.test.ts` | Added route-wrapper tests for the atomic RPC success and free-limit error paths | Protects the feature-flagged integration from regressions | Run `npm run test:unit`. |
| `lib/stripe-webhook.ts` | Claims Stripe event IDs before entitlement sync and releases the claim on sync failure | Removes the local check-then-insert duplicate webhook race | Run duplicate webhook unit tests and Stripe replay in preview. |
| `tests/stripe-webhook.test.ts`, `tests/stripe-webhook-route.test.ts` | Added duplicate-claim and claim-release coverage | Proves duplicate event delivery does not sync entitlement twice in local tests | Run `npm run test:unit -- tests/stripe-webhook.test.ts tests/stripe-webhook-route.test.ts`. |
| `app/not-found.tsx`, `app/error.tsx`, `app/globals.css`, `scripts/smoke-local.mjs` | Added branded 404/global error fallbacks and smoke coverage for unknown routes | Replaces default framework failure pages with professional recovery paths | Run `npm run smoke` and visit an unknown URL. |

## 22. Fixes Not Implemented Yet

| Task | Reason not implemented | Risk | Required action |
|---|---|---|---|
| Atomic quota/invoice numbering migration live application | Migration is prepared locally, but hosted DB writes require owner approval and environment-specific verification | High | Apply to preview first, enable `INVOICE_CREATE_RPC_ENABLED=true`, test concurrency, then repeat for production after approval. |
| Live Stripe setup | Requires owner approval for real money | Critical | Configure live Stripe and run controlled live test. |
| Authenticated E2E/API/RLS tests | Requires browser/database/test-user setup | High | Add Playwright/API/RLS tests in a later phase. |
| CSP | Needs tested allowlist for Supabase/Stripe/PDF behavior | Medium | Add after browser QA. |
| Production deploy | User did not explicitly approve production deploy in this turn | Critical | Approve deploy after docs/fixes review. |
| Monitoring | Requires service choice/account | Medium | Pick Sentry/PostHog/Uptime provider. |

## 23. Path to 100% Completion

### Must Fix Before Beta

| Priority | File/area | Difficulty | Business impact | Technical risk | Estimated effort | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Git/release | Low | High | High | 30 min | Clean commit with all critical files tracked. |
| P0 | Preview deploy | Medium | High | Medium | 1 hr | Preview serves current legal/API/auth routes. |
| P0 | Auth/invoice QA | Medium | High | Medium | 2 hrs | Test user completes signup to saved PDF. |
| P0 | DB quota/numbering | Medium | High | High | 1-2 hrs after DB approval | Prepared migration is applied, flag is enabled, and concurrent creates cannot bypass quota/numbering. |
| P1 | Legal copy depth | Medium | High | Medium | 2-4 hrs | Founder-approved beta legal pages live. |
| P1 | E2E smoke | Medium | High | Medium | 4-6 hrs | Auth/invoice/free-limit tests automated. |

### Must Fix Before Public Launch

| Priority | File/area | Difficulty | Business impact | Technical risk | Estimated effort | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Stripe live | Medium | Critical | High | 2-4 hrs | Live checkout/webhook/portal/cancel verified. |
| P0 | Production deploy | Medium | Critical | High | 1-2 hrs | Production legal/API routes return expected codes. |
| P1 | Security hardening | Medium | High | Medium | 4-8 hrs | Rate limit/origin/CSP active and tested. |
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

This site is not beta-ready today until the current working tree is pushed/deployed to preview and authenticated QA passes. It is not production-ready. Current score: 87/100 beta readiness, 62/100 production readiness.

Next action: resolve GitHub push credentials, deploy current source to preview, run the full authenticated QA checklist, apply and verify the atomic invoice migration on preview, then address live Stripe blockers before any public paid launch.
