import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ihateinvoices.com'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'I Hate Invoices | Simple invoice software',
    template: '%s | I Hate Invoices',
  },
  description: 'Create invoices, manage client records, export PDFs, and track payment status from one focused workspace.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'I Hate Invoices | Simple invoice software',
    description: 'Create invoices, manage client records, export PDFs, and track payment status from one focused workspace.',
    url: '/',
    siteName: 'I Hate Invoices',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'I Hate Invoices | Simple invoice software',
    description: 'Create invoices, manage client records, export PDFs, and track payment status from one focused workspace.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
