import type { Metadata } from 'next';
import { companyInfo } from '@/lib/company';
import { LegalPage, LegalSection } from '../legal-page';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy | I Hate Invoices',
};

export default function RefundsPage() {
  return (
    <LegalPage title="Refund and Cancellation Policy" updated="May 24, 2026">
      <LegalSection title="Cancellations">
        <p>
          You can cancel a Pro subscription through the Stripe billing portal when paid billing is enabled. Cancellation stops future renewals and keeps paid access active through the current billing period.
        </p>
      </LegalSection>

      <LegalSection title="Refunds">
        <p>
          Monthly subscription fees are generally non-refundable once a billing period starts, except where required by law or where a duplicate charge, billing error, or service access issue is confirmed.
        </p>
      </LegalSection>

      <LegalSection title="Billing Help">
        <p>
          Contact {companyInfo.legalName} at {companyInfo.contactEmail} within 7 days of a billing issue and include the account email and Stripe receipt ID if available.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
