# I Hate Invoices Security Audit

This is an engineering security checklist, not a formal penetration test.

## Current Verdict

Security is acceptable for controlled internal testing after the current code is deployed to preview and authenticated QA passes. It is not ready for public paid production.

## Critical Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| Production does not serve current billing/API routes | Live `/api/billing/status` and `/api/stripe/webhook` return `404`; local files exist in `app/api/billing/*` and `app/api/stripe/webhook/route.ts` | Live production cannot enforce billing or receive Stripe webhooks | Commit/push/deploy current working tree and smoke production. |

## High Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| Free quota enforcement is non-atomic | `app/api/invoices/route.ts` counts invoices, then inserts later | Concurrent requests can exceed free quota | Move create/quota/invoice-number logic into a Postgres transaction/RPC. |
| Invoice numbering is race-prone | `app/api/invoices/route.ts` generates invoice number from count | Duplicate number under concurrency | Use per-user sequence/counter in DB transaction. |
| No automated RLS/security tests | No test framework or RLS test suite | Cross-user regressions may ship unnoticed | Add RLS tests for clients, invoices, billing profiles. |

## Medium Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| No app-level CSRF/origin/rate limiting on POST routes | `app/api/invoices/route.ts`, `app/api/billing/*` | Abuse or cross-site form submission risk | Add origin checks and per-user/IP rate limiting. |
| Webhook idempotency not atomic | `app/api/stripe/webhook/route.ts` checks existing event before processing and inserts after | Duplicate event race | Insert event lock first or use atomic RPC/transaction. |
| DB-level field limits are still incomplete | App-level invoice/client/line-item limits now exist in `app/api/invoices/route.ts` and UI forms, but DB constraints are still broad `TEXT`/`JSONB` fields | Direct database API usage or future code paths could bypass app limits | Add DB constraints in the approved Supabase migration phase. |
| CSP missing | `next.config.ts` has baseline headers but no CSP | XSS blast radius higher | Add tested CSP after mapping Supabase/Stripe requirements. |
| Moderate dependency advisories | `npm audit` reports Next via bundled PostCSS advisory | XSS advisory in dependency chain | Track Next/PostCSS fix; do not force downgrade. |

## Low Findings

| Finding | Evidence | Risk | Required fix |
|---|---|---|---|
| API route gating excludes all `/api/*` in proxy | `proxy.ts` | Future route drift | Continue requiring auth in each API route; add tests. |
| Composite ownership constraints missing | `supabase/schema.sql` `invoices.client_id` FK only references `clients(id)` | Direct API writes could reference another user's known UUID | Add composite ownership constraint or server-only writes/RPC. |

## Positive Controls

- Supabase RLS is enabled for core tables.
- Stripe webhook signature verification is present.
- Service-role key usage is server-only in inspected code.
- Browser Supabase client now uses SSR-compatible auth cookies.
- Login redirect stays on same-site relative paths.

## Commands

```bash
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=low
rg -n "TODO|FIXME|console\\.log|debugger|service_role|sk_|pk_" -g '!node_modules' -g '!.next'
```
