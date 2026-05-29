'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFTemplate } from '@/components/PDFTemplate';
import type { Invoice } from '@/types/invoice';

type InvoicePdfDownloadButtonProps = {
  invoice: Invoice;
};

function buildPdfFileName(invoiceNumber: string) {
  const safeName = invoiceNumber.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
  return `${safeName || 'invoice'}.pdf`;
}

export function InvoicePdfDownloadButton({ invoice }: InvoicePdfDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setGenerating(true);
    setError('');

    try {
      const blob = await pdf(<PDFTemplate invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = buildPdfFileName(invoice.invoice_number);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Invoice PDF download failed.', downloadError);
      setError('PDF download failed. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <span className="app-download-action">
      <button
        type="button"
        onClick={handleDownload}
        disabled={generating}
        className="app-btn app-btn-secondary"
      >
        {generating ? 'Preparing...' : 'Download PDF'}
      </button>
      {error && (
        <span className="app-inline-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
