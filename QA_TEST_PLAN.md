# I Hate Invoices QA Test Plan

## Current Testing State

Vitest unit testing is installed for pure helper and selected API wrapper coverage. Current automated checks include lint, TypeScript, production build, static readiness guard, unit tests, and route smoke checks. Unit tests cover billing helpers, billing route response/session builders, server environment helpers, invoice validation, request-security helpers, Stripe webhook processing helpers, signed Stripe webhook route fixtures, atomic webhook duplicate-event claiming, billing API route wrappers, invoice API route wrappers, the feature-flagged atomic invoice RPC path, and the static readiness guard. Authenticated E2E, accessibility, visual regression, preview Stripe replay, Supabase RLS tests, and live verification of the atomic invoice migration are still missing.

## Minimum Tests Required Before Beta

| Area | Test | Acceptance criteria |
|---|---|---|
| Auth | Signup, email verification, login, logout, password reset | Test user can complete each flow and protected routes redirect correctly. |
| Clients | Add client and list clients | Client appears only for the signed-in user. |
| Invoices | Create invoice with existing/new client | Server saves invoice, dashboard shows it, detail route opens. |
| PDF | Download saved invoice PDF | Download is only available after saved invoice route; unsaved invoice cannot bypass quota. |
| Free limit | Create 3 invoices as free user, attempt 4th | Fourth create returns upgrade path and no invoice is inserted. |
| Atomic invoice create | Apply `20260529090606_atomic_invoice_create.sql`, enable `INVOICE_CREATE_RPC_ENABLED=true`, run concurrent invoice creates | Concurrent creates cannot exceed quota or duplicate invoice numbers. |
| Billing status | Dashboard status for free/pro | Correct usage/plan appears from `/api/billing/status`. |
| Public routes | `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/refunds` | All return `200` on preview. |
| 404 fallback | Unknown route such as `/definitely-missing` | Returns `404` with the branded not-found page. |
| Legal links | Footer/auth links | Links resolve and display Booman Systems LLC contact info configured in `lib/company.ts`. |

## Minimum Tests Required Before Paid Public Launch

| Area | Test | Acceptance criteria |
|---|---|---|
| Stripe checkout | Free user starts Pro checkout | Stripe test/live mode session opens from server. |
| Stripe webhook | `checkout.session.completed` and subscription events | Verified webhook grants Pro entitlement server-side. |
| Billing portal | Pro user opens portal | Portal opens and returns to dashboard. |
| Cancellation/downgrade | Subscription canceled | Webhook removes Pro entitlement. |
| Idempotency | Duplicate Stripe event | Event claim insert prevents double entitlement sync; duplicate replay returns `{ received: true, duplicate: true }`. |
| RLS | Two users with clients/invoices | Neither user can read/update the other user's data. |
| Error handling | Bad auth, bad payload, missing env, Stripe failure | User gets safe message; logs contain useful server-side detail. |
| Accessibility | Keyboard-only auth/dashboard/invoice flows | Focus visible, no keyboard traps, form errors announced. |

## Suggested Test Stack

- Unit/integration: Vitest
- API route tests: Vitest with mocked Supabase/Stripe clients
- E2E: Playwright
- Accessibility: Playwright + axe
- Stripe webhook fixtures: Vitest-signed route fixture for local signature acceptance and duplicate-event claiming; Stripe CLI preview/live replay still required before launch

## Commands

```bash
npm run lint
npm run readiness
npm run test:unit
npm run typecheck
npm run build
npm run smoke
npm audit --audit-level=low
```

Future commands after test tooling is added:

```bash
npm run test:e2e
npm run test:a11y
```

## Static Readiness Guard

`npm run readiness` checks that release-critical files exist, runtime copy does not reintroduce blocked stale language, and the new invoice page cannot download an unsaved PDF. It is not a substitute for authenticated E2E or Supabase RLS tests.

## Database Migration QA

The atomic invoice migration is committed as `supabase/migrations/20260529090606_atomic_invoice_create.sql` and mirrored in `supabase/schema.sql`. It must be applied to a preview Supabase database and verified before setting `INVOICE_CREATE_RPC_ENABLED=true` in any deployed environment. Until that flag is enabled, `/api/invoices` continues to use the existing non-atomic fallback path.
