# I Hate Invoices Completion Punch List

## Must Fix Before Beta

Completed in the current release pass: Git push, GitHub Actions CI, production deploy, public/legal/API route smoke, CSP header smoke, and branded 404 smoke.

| Priority | File/area | Task | Difficulty | Business impact | Technical risk | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Authenticated QA | Smoke authenticated signup/login/invoice/PDF flow on production | Medium | High | Medium | Test user can sign up, verify/login, create client, save invoice, and download saved PDF on production. |
| P0 | `/api/invoices` + DB | Apply and verify prepared atomic invoice RPC migration | Medium | High | High | `20260529090606_atomic_invoice_create.sql` is applied to preview, `INVOICE_CREATE_RPC_ENABLED=true` is enabled, and concurrent creates cannot exceed quota or duplicate invoice numbers. |
| P0 | Stripe | Complete preview Stripe checkout/webhook/portal QA | Medium | High | High | Test subscription grants/removes Pro through webhook, and duplicate event replay does not double-process entitlement. |
| P1 | Legal pages | Deploy `/terms`, `/privacy`, `/refunds` and add missing privacy/cookie/minors language | Medium | High | Medium | Legal pages reachable and founder-approved. |
| P1 | Security | Verify CSP on preview and add broader abuse monitoring | Medium | High | Medium | Preview auth/PDF/Stripe flows pass under CSP, and production has abuse signals beyond local request throttles. |
| P1 | QA automation | Add authenticated E2E and Supabase RLS tests | Medium | High | Medium | Auth, invoice save, free limit, billing status, and cross-user isolation are proven outside pure unit mocks. |

## Should Fix Before Public Launch

| Priority | File/area | Task | Difficulty | Business impact | Technical risk | Acceptance criteria |
|---|---|---|---|---|---|---|
| P1 | Stripe production | Configure live Product/Price/webhook/portal | Medium | Critical | High | Live subscription tested with owner approval. |
| P1 | Supabase | Add composite indexes and integrity constraints | Medium | Medium | Medium | Hot queries indexed; invalid totals/statuses rejected. |
| P1 | Monitoring | Add error tracking and uptime monitoring | Medium | High | Low | Production failures notify owner. |
| P2 | Dashboard/clients | Add pagination/search/mobile cards | Medium | Medium | Medium | Large accounts stay usable. |
| P2 | Product UX | Expand first-run checklist with completion state | Low | Medium | Low | New users see clear next step path and completed steps. |

## Nice To Have

- Client edit/delete.
- Invoice edit/delete/duplicate.
- Email invoice sending.
- Payment links on invoices.
- CSV export.
- Account deletion/export workflow.

## Future Version

- Direct online invoice payment collection.
- Recurring invoices.
- Automatic overdue reminders.
- Multi-currency/tax profiles.
- Team accounts.
