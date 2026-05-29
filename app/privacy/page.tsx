import type { Metadata } from 'next';
import { companyInfo } from '@/lib/company';
import { LegalPage, LegalSection } from '../legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy | I Hate Invoices',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 24, 2026">
      <LegalSection title="Information We Collect">
        <p>
          We collect account email addresses, authentication records, invoice data, client data you enter, billing status, and basic technical information needed to operate the app.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Information">
        <p>
          We use this information to provide the invoicing service, secure accounts, save invoice records, enforce plan limits, process billing, respond to support requests, and improve reliability.
        </p>
      </LegalSection>

      <LegalSection title="Service Providers">
        <p>
          Supabase provides authentication and database services, Vercel hosts the application, and Stripe processes paid subscriptions. Payment card details are handled by Stripe, not stored directly by I Hate Invoices.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and Sessions">
        <p>
          The app uses necessary authentication cookies and similar session storage so users can sign in, stay signed in, and access protected invoice records. We do not currently describe any advertising or behavioral tracking cookies in the app source.
        </p>
      </LegalSection>

      <LegalSection title="Client and Invoice Data">
        <p>
          You are responsible for having the right to enter client names, emails, addresses, invoice details, notes, and related business information into the service. Do not enter sensitive personal information that is not needed for invoicing.
        </p>
      </LegalSection>

      <LegalSection title="Data Control">
        <p>
          For invoice, client, account-level deletion, or data questions, contact {companyInfo.legalName} at {companyInfo.contactEmail}. Some billing and transaction records may need to be retained for legal, tax, fraud-prevention, dispute, or service-integrity reasons.
        </p>
      </LegalSection>

      <LegalSection title="Data Retention">
        <p>
          We keep account, invoice, client, and billing records while your account is active and as needed to operate the service, resolve disputes, meet legal or tax obligations, prevent abuse, and maintain backups. If you request account deletion, we will review and process the request subject to records we are required or permitted to keep.
        </p>
      </LegalSection>

      <LegalSection title="Regional Privacy Rights">
        <p>
          Depending on where you live, you may have rights to request access, correction, deletion, portability, or limits on certain processing of your personal information. To make a request, contact {companyInfo.contactEmail}. We do not sell personal information as that term is commonly used in U.S. state privacy laws.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          I Hate Invoices is intended for business users and is not directed to children under 13. If you believe a child has provided personal information, contact {companyInfo.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use hosted authentication, route protection, row-level database policies, and server-side billing checks. No internet service can guarantee perfect security, so keep your password private and report suspicious account activity.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
