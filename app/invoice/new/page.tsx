'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Plus, Trash2, Download, Save, FileText } from 'lucide-react'
import { Invoice, LineItem } from '@/types/invoice'
import { generateInvoiceNumber, calculateTotals, formatCurrency } from '@/lib/invoice-utils'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => m.PDFDownloadLink),
  { ssr: false }
)
const PDFTemplateComponent = dynamic(
  () => import('@/components/PDFTemplate').then(m => ({ default: m.PDFTemplate })),
  { ssr: false }
)

const today = new Date().toISOString().split('T')[0]
const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

export default function NewInvoice() {
  const [invoice, setInvoice] = useState<Invoice>({
    invoice_number: generateInvoiceNumber(),
    client_name: '', client_email: '', client_address: '',
    line_items: [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0,
    status: 'draft', notes: '',
    invoice_date: today, due_date: due,
  })

  const updateField = (field: keyof Invoice, value: unknown) => {
    setInvoice(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'line_items' || field === 'tax_rate') {
        const items = field === 'line_items' ? value as LineItem[] : prev.line_items
        const tax = field === 'tax_rate' ? value as number : prev.tax_rate
        const totals = calculateTotals(items, tax)
        return { ...updated, ...totals }
      }
      return updated
    })
  }

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const items = [...invoice.line_items]
    items[index] = { ...items[index], [field]: value }
    if (field === 'quantity' || field === 'rate') {
      items[index].amount = items[index].quantity * items[index].rate
    }
    updateField('line_items', items)
  }

  const addItem = () => {
    updateField('line_items', [...invoice.line_items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    if (invoice.line_items.length > 1) updateField('line_items', invoice.line_items.filter((_, i) => i !== index))
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }

  return (
    <div className="min-h-screen" style={{background: 'var(--bg)'}}>
      <header className="border-b sticky top-0 z-10" style={{borderColor: 'var(--border)', background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(8px)'}}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm" style={{color: 'var(--text3)'}}>
              <FileText className="w-4 h-4" style={{color: 'var(--accent)'}} /> Invoice-gen
            </Link>
            <span style={{color: 'var(--border)'}}>/</span>
            <span className="text-sm font-semibold" style={{color: 'var(--text)'}}>New Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style={{border: '1px solid var(--border)', color: 'var(--text2)', background: 'transparent'}}>
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <PDFDownloadLink document={<PDFTemplateComponent invoice={invoice} />} fileName={`${invoice.invoice_number}.pdf`}>
              {({ loading }: { loading: boolean }) => (
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{background: 'var(--accent)'}}>
                  <Download className="w-4 h-4" /> {loading ? 'Generating...' : 'Download PDF'}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — Form */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
            <h3 className="font-semibold text-sm mb-4" style={{color: 'var(--text)'}}>Invoice Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>Invoice Number</label><input style={inputStyle} value={invoice.invoice_number} onChange={e => updateField('invoice_number', e.target.value)} /></div>
              <div><label style={labelStyle}>Invoice Date</label><input type="date" style={inputStyle} value={invoice.invoice_date} onChange={e => updateField('invoice_date', e.target.value)} /></div>
              <div><label style={labelStyle}>Due Date</label><input type="date" style={inputStyle} value={invoice.due_date} onChange={e => updateField('due_date', e.target.value)} /></div>
              <div><label style={labelStyle}>Tax Rate (%)</label><input type="number" style={inputStyle} value={invoice.tax_rate} onChange={e => updateField('tax_rate', parseFloat(e.target.value) || 0)} /></div>
            </div>
          </div>

          <div className="p-5 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
            <h3 className="font-semibold text-sm mb-4" style={{color: 'var(--text)'}}>Bill To</h3>
            <div className="space-y-3">
              <div><label style={labelStyle}>Client Name</label><input style={inputStyle} value={invoice.client_name} onChange={e => updateField('client_name', e.target.value)} /></div>
              <div><label style={labelStyle}>Client Email</label><input type="email" style={inputStyle} value={invoice.client_email} onChange={e => updateField('client_email', e.target.value)} /></div>
              <div><label style={labelStyle}>Client Address</label><textarea rows={2} style={inputStyle} value={invoice.client_address} onChange={e => updateField('client_address', e.target.value)} /></div>
            </div>
          </div>

          <div className="p-5 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
            <h3 className="font-semibold text-sm mb-4" style={{color: 'var(--text)'}}>Line Items</h3>
            <div className="space-y-2 mb-3">
              {invoice.line_items.map((item, i) => (
                <div key={item.id} className="grid gap-2" style={{gridTemplateColumns: '3fr 1fr 1fr 1fr auto'}}>
                  <input placeholder="Description" style={inputStyle} value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  <input type="number" placeholder="Qty" style={inputStyle} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} />
                  <input type="number" placeholder="Rate" style={inputStyle} value={item.rate} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} />
                  <div className="flex items-center px-3 text-sm font-semibold rounded-lg" style={{background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)'}}>{formatCurrency(item.amount)}</div>
                  <button onClick={() => removeItem(i)} className="p-2 rounded-lg" style={{color: 'var(--error)'}}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg" style={{border: '1px dashed var(--border)', color: 'var(--text3)', background: 'transparent'}}>
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>

          <div className="p-5 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
            <div className="flex justify-between text-sm py-1.5" style={{borderBottom: '1px solid var(--border)', color: 'var(--text2)'}}><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            {invoice.tax_rate > 0 && <div className="flex justify-between text-sm py-1.5" style={{borderBottom: '1px solid var(--border)', color: 'var(--text2)'}}><span>Tax ({invoice.tax_rate}%)</span><span>{formatCurrency(invoice.tax_amount)}</span></div>}
            <div className="flex justify-between font-bold text-lg mt-3" style={{color: 'var(--text)'}}><span>Total Due</span><span style={{color: 'var(--accent)'}}>{formatCurrency(invoice.total)}</span></div>
          </div>

          <div className="p-5 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea rows={3} placeholder="Payment terms, thank you note, etc." style={inputStyle} value={invoice.notes} onChange={e => updateField('notes', e.target.value)} />
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="p-4 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" style={{color: 'var(--accent)'}} />
              <span className="text-sm font-semibold" style={{color: 'var(--text)'}}>Invoice Preview</span>
              <span className="text-xs ml-auto" style={{color: 'var(--text3)'}}>Updates in real time</span>
            </div>
            <div className="rounded-lg p-6 text-sm" style={{background: '#ffffff', color: '#1e293b', minHeight: 400}}>
              <div className="flex justify-between mb-6">
                <div><div className="font-bold text-base text-slate-900">Booman Systems LLC</div><div className="text-xs text-slate-500 mt-1">admin@modeos.app</div></div>
                <div className="text-right"><div className="font-bold text-2xl" style={{color: '#2563eb'}}>INVOICE</div><div className="text-xs text-slate-500 mt-1">#{invoice.invoice_number}</div><div className="text-xs text-slate-500">Date: {invoice.invoice_date}</div><div className="text-xs text-slate-500">Due: {invoice.due_date}</div></div>
              </div>
              {invoice.client_name && <div className="mb-4"><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bill To</div><div className="font-semibold text-slate-900">{invoice.client_name}</div>{invoice.client_email && <div className="text-xs text-slate-500">{invoice.client_email}</div>}</div>}
              <table className="w-full text-xs mb-4">
                <thead><tr className="bg-slate-100"><th className="text-left p-2 text-slate-500">Description</th><th className="text-center p-2 text-slate-500">Qty</th><th className="text-right p-2 text-slate-500">Rate</th><th className="text-right p-2 text-slate-500">Amount</th></tr></thead>
                <tbody>{invoice.line_items.filter(i => i.description).map((item, i) => (
                  <tr key={i} className="border-b border-slate-100"><td className="p-2">{item.description}</td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-right">{formatCurrency(item.rate)}</td><td className="p-2 text-right">{formatCurrency(item.amount)}</td></tr>
                ))}</tbody>
              </table>
              <div className="text-right space-y-1">
                <div className="text-xs text-slate-500">Subtotal: {formatCurrency(invoice.subtotal)}</div>
                {invoice.tax_rate > 0 && <div className="text-xs text-slate-500">Tax: {formatCurrency(invoice.tax_amount)}</div>}
                <div className="font-bold text-sm" style={{color: '#2563eb'}}>Total: {formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
