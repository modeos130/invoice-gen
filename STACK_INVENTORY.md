# I Hate Invoices Stack Inventory

All paths are under `/Users/booman/projects/invoice-gen` unless noted.

| Technology / service | Purpose | Where it appears | Required env | Risk | Notes |
|---|---|---|---|---|---|
| Next.js 16 App Router | Frontend and server routes | `package.json`, `app/*`, `next.config.ts` | `NEXT_PUBLIC_APP_URL` | Medium | Build passes; production must be re-smoked after every push. |
| React 19 | UI runtime | `package.json`, app pages | None | Low | Mostly client components for app workspace. |
| Tailwind CSS 4 plus custom app shell CSS | Styling | `app/globals.css`, `components/AppPageShell.tsx`, `postcss.config.mjs` | None | Low | Public, auth, and protected app pages use custom product styling distinct from the retired dark-blue page. |
| Supabase Auth | Signup, login, password reset, sessions | `lib/supabase.ts`, `lib/supabase-server.ts`, `app/auth/callback/route.ts`, auth pages, `proxy.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | High | Browser client uses `@supabase/ssr` cookies; email verification links route through `/auth/callback`. Authenticated QA still required. |
| Supabase Postgres/RLS | Clients, invoices, invoice counters, billing profiles, webhook event records | `supabase/schema.sql`, `supabase/migrations/*`, app/API routes | `SUPABASE_SERVICE_ROLE_KEY` server-side; `INVOICE_CREATE_RPC_ENABLED` after authenticated QA | High | Hosted migrations through `20260529121916_grant_create_invoice_atomic.sql` are applied; RPC flag remains off until authenticated invoice/concurrency QA. |
| Stripe | Pro subscription checkout, portal, webhook entitlement | `lib/stripe.ts`, `lib/stripe-webhook.ts`, `app/api/billing/*`, `app/api/stripe/webhook/route.ts` | `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | Critical | Preview/test plumbing exists and webhook event claiming is unit-tested; production live billing remains unproven. |
| React PDF | Saved invoice PDF export | `components/PDFTemplate.tsx`, invoice detail route | None | Medium | Unsaved PDF bypass was removed; heavy chunks should be loaded only on demand later. |
| Vercel | Hosting/deployment | `vercel.json`, `.vercel/project.json` | Vercel project env | Medium | Production deploy is current and smoke-tested on `ihateinvoices.com` and `www.ihateinvoices.com`; authenticated QA still required. |
| Supabase email | Transactional auth email | Auth pages | Supabase dashboard config | Medium | Email redirect allowlist and real reset/signup QA still required. |
| Security headers | Basic response hardening and CSP | `next.config.ts`, `scripts/smoke-local.mjs` | None | Medium | Added nosniff, frame deny, referrer policy, permissions policy, and enforced CSP baseline; authenticated preview browser QA still required. |
| SEO metadata | Titles, descriptions, OG/Twitter, robots, sitemap | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` | `NEXT_PUBLIC_APP_URL` | Medium | Baseline is deployed and sitemap/canonical use `https://www.ihateinvoices.com`; richer OG/schema work remains. |
| Testing tools | Static validation, unit tests, smoke checks | `package.json`, `tests/*`, `scripts/*`, `.github/workflows/ci.yml` | None | Medium | Vitest unit tests exist for helpers, route wrappers, Stripe webhook duplicate claiming, and atomic invoice RPC flag behavior; E2E, preview Stripe replay, and RLS tests still needed. |
| Analytics/monitoring | Uptime and incident triage baseline | `app/api/health/route.ts`, `scripts/smoke-local.mjs`, `PRODUCTION_MONITORING.md`; owner-managed UptimeRobot | Optional future error-tracking DSN | Medium | `/api/health` and Vercel log runbook exist; dedicated error tracking such as Sentry is still a paid-launch improvement. |

## Dependency Notes

- `npm audit --audit-level=low --json` reports 2 moderate advisories through `next` bundled `postcss <8.5.10`; no high or critical advisories on May 28, 2026.
- `npm ls --depth=0` exits, but local `node_modules` reports several extraneous packages. Run a clean install before release.
- GitHub Actions workflow exists in `.github/workflows/ci.yml`, but the current GitHub OAuth credential cannot push workflow files without `workflow` scope.
