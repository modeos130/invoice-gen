import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

type AppPageShellProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  width?: 'md' | 'lg' | 'xl';
};

const widthClass = {
  md: 'app-container-md',
  lg: 'app-container-lg',
  xl: 'app-container-xl',
};

export function AppPageShell({
  title,
  subtitle,
  backHref,
  backLabel = 'Dashboard',
  actions,
  children,
  width = 'xl',
}: AppPageShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className={`app-header-inner ${widthClass[width]}`}>
          <div className="app-header-title">
            {backHref ? (
              <Link className="app-back-link" href={backHref}>
                <ArrowLeft aria-hidden="true" size={16} />
                {backLabel}
              </Link>
            ) : (
              <Link className="app-brand" href="/dashboard" aria-label="I Hate Invoices dashboard">
                <span className="app-brand-mark">
                  <FileText aria-hidden="true" size={18} />
                </span>
                <span>
                  <strong>I Hate Invoices</strong>
                  <small>Invoice workspace</small>
                </span>
              </Link>
            )}
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="app-actions">{actions}</div>}
        </div>
      </header>
      <main className={`app-main ${widthClass[width]}`}>{children}</main>
    </div>
  );
}
