# I Hate Invoices Completion Punch List

## Must Fix Before Beta

Completed in the current release pass: Git push, GitHub Actions CI, production deploy, public/legal/API route smoke, CSP header smoke, branded 404 smoke, hosted Supabase atomic invoice migrations, auth callback routing, live public auth-route verification, protected-page source restyling, owner live auth/invoice/PDF/Stripe QA, password reset QA, archive/restore QA, mobile spot-check, and production monitoring baseline.

| Priority | File/area | Task | Difficulty | Business impact | Technical risk | Acceptance criteria |
|---|---|---|---|---|---|---|
| P1 | Legal pages | Founder/legal review of `/terms`, `/privacy`, and `/refunds` | Medium | High | Medium | Legal pages are owner-approved for subscription, cancellation, refund, privacy, and business-contact language. |

## Should Fix Before Public Launch

| Priority | File/area | Task | Difficulty | Business impact | Technical risk | Acceptance criteria |
|---|---|---|---|---|---|---|
| P1 | Stripe/Vercel | Confirm old keys are unused before rotation/removal | Low | High | Medium | No currently used project depends on old values before any key is deleted or rotated. |
| P1 | Supabase | Add composite indexes and integrity constraints | Medium | Medium | Medium | Hot queries indexed; invalid totals/statuses rejected. |
| P1 | Monitoring | Add third-party error tracking after uptime baseline if traffic increases | Medium | High | Low | `/api/health`, UptimeRobot coverage, Vercel log runbook, and owner-approved error tracking are active. |
| P1 | QA automation | Add authenticated E2E and Supabase RLS tests | Medium | High | Medium | Auth, invoice save, free limit, billing status, and cross-user isolation are proven outside pure unit mocks. |
| P2 | Dashboard/clients | Add pagination/search/mobile cards | Medium | Medium | Medium | Large accounts stay usable. |
| P2 | Product UX | Expand first-run checklist with completion state | Low | Medium | Low | New users see clear next step path and completed steps. |

## Nice To Have

- Client edit and support-only hard delete workflow.
- Invoice edit, duplicate, and support-only hard delete workflow.
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
