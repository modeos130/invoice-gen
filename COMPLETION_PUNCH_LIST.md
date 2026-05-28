# I Hate Invoices Completion Punch List

## Must Fix Before Beta

| Priority | File/area | Task | Difficulty | Business impact | Technical risk | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Git/release | Commit/push current legal/API/auth/billing files | Low | High | High if skipped | Reproducible deploy from repo. |
| P0 | Production/preview | Deploy current source to preview and smoke authenticated flow | Medium | High | Medium | Signup through saved invoice works on preview. |
| P0 | `/api/invoices` + DB | Make free limit and invoice numbering atomic | High | High | High | Concurrent creates cannot exceed quota or duplicate invoice numbers. |
| P0 | Stripe | Complete preview Stripe checkout/webhook/portal QA | Medium | High | High | Test subscription grants/removes Pro through webhook. |
| P1 | Legal pages | Deploy `/terms`, `/privacy`, `/refunds` and add missing privacy/cookie/minors language | Medium | High | Medium | Legal pages reachable and founder-approved. |
| P1 | Security | Add origin/CSRF checks and rate limiting | Medium | High | Medium | POST routes reject suspicious origins and abusive repeat calls. |
| P1 | QA | Add minimum E2E smoke tests | Medium | High | Medium | Auth, invoice, PDF, free limit, billing route smoke automated. |

## Should Fix Before Public Launch

| Priority | File/area | Task | Difficulty | Business impact | Technical risk | Acceptance criteria |
|---|---|---|---|---|---|---|
| P1 | Stripe production | Configure live Product/Price/webhook/portal | Medium | Critical | High | Live subscription tested with owner approval. |
| P1 | Supabase | Add composite indexes and integrity constraints | Medium | Medium | Medium | Hot queries indexed; invalid totals/statuses rejected. |
| P1 | Monitoring | Add error tracking and uptime monitoring | Medium | High | Low | Production failures notify owner. |
| P2 | Dashboard/clients | Add pagination/search/mobile cards | Medium | Medium | Medium | Large accounts stay usable. |
| P2 | Product UX | Add first-run checklist | Low | Medium | Low | New users see clear next step path. |

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
