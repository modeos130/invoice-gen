# I Hate Invoices Stack Inventory

All paths are under `/Users/booman/projects/invoice-gen` unless noted.

| Technology / service | Purpose | Where it appears | Required env | Risk | Notes |
|---|---|---|---|---|---|
| Next.js 16 App Router | Frontend and server routes | `package.json`, `app/*`, `next.config.ts` | `NEXT_PUBLIC_APP_URL` | Medium | Build passes; production currently drifts from local source. |
| React 19 | UI runtime | `package.json`, app pages | None | Low | Mostly client components for app workspace. |
| Tailwind CSS 4 | Styling | `app/globals.css`, `postcss.config.mjs` | None | Low | Public and auth pages use custom product styling. |
| Supabase Auth | Signup, login, password reset, sessions | `lib/supabase.ts`, `lib/supabase-server.ts`, auth pages, `proxy.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | High | Browser client now uses `@supabase/ssr` cookies. Auth QA still required. |
| Supabase Postgres/RLS | Clients, invoices, invoice counters, billing profiles, webhook event records | `supabase/schema.sql`, `supabase/migrations/*`, app/API routes | `SUPABASE_SERVICE_ROLE_KEY` server-side; `INVOICE_CREATE_RPC_ENABLED` after migration verification | High | RLS exists; atomic invoice RPC migration is prepared but not live-applied/verified. |
| Stripe | Pro subscription checkout, portal, webhook entitlement | `lib/stripe.ts`, `lib/stripe-webhook.ts`, `app/api/billing/*`, `app/api/stripe/webhook/route.ts` | `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | Critical | Preview/test plumbing exists and webhook event claiming is unit-tested; production live billing remains unproven. |
| React PDF | Saved invoice PDF export | `components/PDFTemplate.tsx`, invoice detail route | None | Medium | Unsaved PDF bypass was removed; heavy chunks should be loaded only on demand later. |
| Vercel | Hosting/deployment | `vercel.json`, `.vercel/project.json` | Vercel project env | High | Production 404s for current legal/API routes; deploy drift blocks launch. |
| Supabase email | Transactional auth email | Auth pages | Supabase dashboard config | Medium | Email redirect allowlist and real reset/signup QA still required. |
| Security headers | Basic response hardening | `next.config.ts` | None | Medium | Added nosniff, frame deny, referrer policy, permissions policy. CSP still needed. |
| SEO metadata | Titles, descriptions, OG/Twitter, robots, sitemap | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts` | `NEXT_PUBLIC_APP_URL` | Medium | Added safe baseline; production must deploy it. |
| Testing tools | Static validation, unit tests, smoke checks | `package.json`, `tests/*`, `scripts/*`, `.github/workflows/ci.yml` | None | Medium | Vitest unit tests exist for helpers, route wrappers, Stripe webhook duplicate claiming, and atomic invoice RPC flag behavior; E2E, preview Stripe replay, and RLS tests still needed. |
| Analytics/monitoring | Not present | No Sentry/PostHog/logger code found | TBD | Medium | Needed before paid public launch. |

## Dependency Notes

- `npm audit --audit-level=low --json` reports 2 moderate advisories through `next` bundled `postcss <8.5.10`; no high or critical advisories on May 28, 2026.
- `npm ls --depth=0` exits, but local `node_modules` reports several extraneous packages. Run a clean install before release.
- GitHub Actions workflow exists in `.github/workflows/ci.yml`, but the current GitHub OAuth credential cannot push workflow files without `workflow` scope.
