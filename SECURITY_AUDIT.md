# I Hate Invoices Security Audit

This is an engineering security checklist, not a formal penetration test.

## Current Verdict

Security is acceptable for controlled internal testing after authenticated QA passes. It is not ready for public paid production.

## Critical Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| Production paid billing is not configured | Vercel Production env does not list `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, or `STRIPE_WEBHOOK_SECRET`; unauthenticated route smoke passes but paid flow is untested | Authenticated paid checkout/webhook/portal cannot be considered live-money ready | Add live Production Stripe env values, configure webhook endpoint, and run controlled paid-flow QA. |

## High Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| Free quota enforcement is non-atomic by default | `app/api/invoices/route.ts` still falls back to count-then-insert unless `INVOICE_CREATE_RPC_ENABLED=true`; hosted atomic RPC migrations are applied | Concurrent requests can exceed free quota until authenticated QA verifies and enables the RPC flag | Run authenticated invoice/concurrency QA, then enable `INVOICE_CREATE_RPC_ENABLED=true`. |
| Invoice numbering is race-prone by default | Existing fallback generates invoice number from count; hosted `invoice_counters` table/RPC now exists but is not live-enabled | Duplicate number under concurrency until RPC path is enabled | Verify authenticated invoice creation through the RPC path and enable the flag. |
| No automated RLS/security tests | No test framework or RLS test suite | Cross-user regressions may ship unnoticed | Add RLS tests for clients, invoices, billing profiles. |

## Medium Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| Rate limiting is in-memory only | `app/api/invoices/route.ts` and `app/api/billing/*` use same-origin checks and local per-user buckets | Abuse controls reset across serverless instances and deploys | Add durable provider-level or database-backed throttling before broad public launch. |
| Webhook idempotency not live-replayed | `lib/stripe-webhook.ts` now atomically claims events before processing and production serves the current route | Duplicate replay behavior is not proven against real Stripe delivery | Replay duplicate Stripe events in preview/live test mode after webhook env is configured. |
| DB-level field limits are still incomplete | App-level invoice/client/line-item limits now exist in `app/api/invoices/route.ts` and UI forms, but DB constraints are still broad `TEXT`/`JSONB` fields | Direct database API usage or future code paths could bypass app limits | Add DB constraints in the approved Supabase migration phase. |
| CSP not preview/browser-proven | `next.config.ts` now sets an enforced CSP and smoke checks the header; authenticated browser QA is still needed | Overly strict policy could break an untested paid/auth flow | Verify signup, invoice PDF, checkout redirect, and billing portal on preview with browser devtools open. |
| Moderate dependency advisories | `npm audit` reports Next via bundled PostCSS advisory | XSS advisory in dependency chain | Track Next/PostCSS fix; do not force downgrade. |

## Low Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| API route gating excludes all `/api/*` in proxy | `proxy.ts` | Future route drift | Continue requiring auth in each API route; add tests. |
| Composite ownership constraints missing | `supabase/schema.sql` `invoices.client_id` FK only references `clients(id)` | Direct API writes could reference another user's known UUID | Add composite ownership constraint or server-only writes/RPC. |

## Positive Controls

- Supabase RLS is enabled for core tables.
- Stripe webhook signature verification is present.
- Stripe webhook processing now claims event IDs with an atomic insert before entitlement sync and releases the claim if sync fails.
- Service-role key usage is server-only in inspected code.
- Browser Supabase client now uses SSR-compatible auth cookies.
- Login redirect stays on same-site relative paths.
- Supabase email verification now routes through a server callback that exchanges the auth code before redirecting to a same-site relative path.
- A feature-flagged atomic invoice RPC path is prepared locally and covered by route-wrapper unit tests.
- Enforced CSP baseline is configured and smoke-checked on the root route.

## Commands

```bash
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=low
rg -n "TODO|FIXME|console\\.log|debugger|service_role|sk_|pk_" -g '!node_modules' -g '!.next'
```
