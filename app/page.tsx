import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Download,
  FileText,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { companyInfo } from '@/lib/company';

const workflowSteps = [
  {
    title: 'Create the invoice',
    description: 'Add client details, line items, due dates, tax, and notes without fighting a document template.',
  },
  {
    title: 'Export the PDF',
    description: 'Download a clean invoice from the same saved record that powers your dashboard.',
  },
  {
    title: 'Track what changed',
    description: 'Keep drafts, sent invoices, paid work, and outstanding balances visible from one workspace.',
  },
];

const features = [
  {
    icon: FileText,
    title: 'Invoice builder',
    description: 'Structured invoice records with line items, taxes, notes, and due dates.',
  },
  {
    icon: Users,
    title: 'Client records',
    description: 'Reusable client profiles for repeat work and cleaner account history.',
  },
  {
    icon: Download,
    title: 'PDF export',
    description: 'Download professional PDFs without duplicating the source invoice.',
  },
  {
    icon: CircleDollarSign,
    title: 'Payment tracking',
    description: 'See paid, sent, draft, and overdue work without a spreadsheet cleanup session.',
  },
];

const invoiceRows = [
  ['Brand refresh', '2', '$450', '$900'],
  ['Landing page copy', '1', '$325', '$325'],
  ['Client call', '1', '$75', '$75'],
];

export default function Home() {
  return (
    <div className="public-shell">
      <header className="site-header">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="I Hate Invoices home">
            <span className="brand-mark" aria-hidden="true">
              IH
            </span>
            <span>
              <strong>I Hate Invoices</strong>
              <small>Small-business invoice workspace</small>
            </span>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#pricing">Pricing</a>
            <a href={`mailto:${companyInfo.contactEmail}`}>Contact</a>
            <Link href="/login">Sign In</Link>
            <Link className="nav-cta" href="/signup">
              Start Free
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="home-hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <h1>Invoices without the busywork</h1>
              <p>
                Create invoices, keep client records, export PDFs, and track payment status
                from a focused workspace built for independent businesses.
              </p>
              <div className="button-row">
                <Link className="button primary" href="/signup">
                  Start Free
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                <Link className="button secondary" href="/login">
                  Sign In
                </Link>
              </div>
            </div>

            <div className="hero-visual" aria-label="Invoice dashboard preview">
              <div className="mockup-toolbar">
                <div>
                  <span>Invoice #1042</span>
                  <strong>Evergreen Studio</strong>
                </div>
                <button type="button">
                  <Download aria-hidden="true" size={16} />
                  PDF
                </button>
              </div>
              <div className="mockup-summary" aria-label="Invoice summary">
                <div>
                  <span>Total</span>
                  <strong>$1,300.00</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong className="status-paid">Paid</strong>
                </div>
                <div>
                  <span>Due</span>
                  <strong>Jun 14</strong>
                </div>
              </div>
              <div className="mockup-table" aria-label="Invoice line items">
                <div className="mockup-row mockup-head">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Total</span>
                </div>
                {invoiceRows.map(([item, qty, rate, total]) => (
                  <div className="mockup-row" key={item}>
                    <span>{item}</span>
                    <span>{qty}</span>
                    <span>{rate}</span>
                    <span>{total}</span>
                  </div>
                ))}
              </div>
              <div className="mockup-footer">
                <span>
                  <Search aria-hidden="true" size={15} />
                  Client record linked
                </span>
                <span>
                  <Send aria-hidden="true" size={15} />
                  Ready to send
                </span>
              </div>
            </div>
          </div>
          <div className="container trust-strip" aria-label="Product highlights">
            <span>Invoice creation</span>
            <span>Client records</span>
            <span>PDF export</span>
            <span>Payment tracking</span>
            <span>Free and Pro plans</span>
          </div>
        </section>

        <section className="section feature-strip" id="features">
          <div className="container">
            <div className="section-header">
              <h2>Everything needed to send a clean invoice.</h2>
              <p>
                Keep the invoice, client, PDF, and payment status together so billing work
                stays small and repeatable.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <feature.icon aria-hidden="true" size={24} />
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section workflow-section" id="workflow">
          <div className="container workflow-grid">
            <div className="prose-block">
              <h2>A short path from client work to payment status.</h2>
              <p>
                I Hate Invoices keeps billing close to the work: create the invoice,
                export the PDF, and keep the account view current as payment status changes.
              </p>
            </div>
            <div className="workflow-list">
              {workflowSteps.map((step, index) => (
                <article className="workflow-step" key={step.title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section product-band">
          <div className="container product-grid">
            <div className="mini-dashboard" aria-label="Payment tracking preview">
              <div className="dashboard-head">
                <strong>Payment view</strong>
                <span>This month</span>
              </div>
              <div className="metric-grid">
                <div>
                  <span>Paid</span>
                  <strong>$4,820</strong>
                </div>
                <div>
                  <span>Outstanding</span>
                  <strong>$1,175</strong>
                </div>
              </div>
              <div className="status-list">
                <span><Check aria-hidden="true" size={15} /> Paid invoices</span>
                <span><Send aria-hidden="true" size={15} /> Sent invoices</span>
                <span><FileText aria-hidden="true" size={15} /> Draft invoices</span>
              </div>
            </div>
            <div>
              <h2>Designed for the work between getting hired and getting paid.</h2>
              <p>
                Small teams and solo operators do not need a bloated accounting suite to
                stay organized. The app keeps the billing surface narrow: clients,
                invoices, PDFs, and payment status.
              </p>
            </div>
          </div>
        </section>

        <section className="section pricing-section" id="pricing">
          <div className="container pricing-grid">
            <div>
              <h2>Simple pricing that matches invoice volume.</h2>
              <p>
                Start with the free monthly allowance. Upgrade when unlimited invoice
                creation makes more sense.
              </p>
            </div>
            <div className="pricing-cards">
              <article>
                <h3>Free</h3>
                <strong>$0</strong>
                <p>3 invoices per month, client records, PDF downloads, and dashboard tracking.</p>
                <Link className="button secondary light" href="/signup">
                  Start Free
                </Link>
              </article>
              <article>
                <h3>Pro</h3>
                <strong>$7/mo</strong>
                <p>Unlimited invoices, client management, payment tracking, notes, and tax fields.</p>
                <Link className="button primary" href="/signup">
                  Start Pro
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="section contact-cta">
          <div className="container cta-inner">
            <div>
              <h2>Ready to make invoicing smaller?</h2>
              <p>Create the first invoice now, or sign in to continue your workspace.</p>
            </div>
            <div className="cta-actions">
              <Link className="button primary" href="/signup">
                Start Free
              </Link>
              <Link className="button secondary light" href="/login">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link className="footer-brand" href="/">
              I Hate Invoices
            </Link>
            <p>
              Lightweight invoice creation, client records, PDF export, and payment
              tracking for independent businesses.
            </p>
          </div>
          <div>
            <h2>Legal</h2>
            <ul>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/refunds">Refunds</Link></li>
            </ul>
          </div>
          <div>
            <h2>Ownership and Contact</h2>
            <p>
              Operated by {companyInfo.legalName}.
              <br />
              <a href={`mailto:${companyInfo.contactEmail}`}>{companyInfo.contactEmail}</a>
              <br />
              {companyInfo.location}
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 {companyInfo.legalName}. All rights reserved.</span>
          <span>Public pages provide product, support, and legal information only.</span>
        </div>
      </footer>
    </div>
  );
}
