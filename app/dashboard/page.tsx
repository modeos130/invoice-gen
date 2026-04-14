'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { Invoice } from '@/types/invoice'
import { formatCurrency } from '@/lib/invoice-utils'

export default function Dashboard() {
  const [invoices] = useState<Invoice[]>([])

  const stats = {
    total: invoices.reduce((s, i) => s + i.total, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    outstanding: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0),
  }

  return (
    <div className="min-h-screen" style={{background: 'var(--bg)'}}>
      <header className="border-b" style={{borderColor: 'var(--border)', background: 'rgba(10,15,30,0.95)'}}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{color: 'var(--accent)'}} />
            <span className="font-bold" style={{color: 'var(--text)'}}>Invoice-gen</span>
          </div>
          <Link href="/invoice/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{background: 'var(--accent)'}}>
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Invoiced', value: formatCurrency(stats.total), icon: DollarSign, color: 'var(--accent)' },
            { label: 'Total Paid', value: formatCurrency(stats.paid), icon: CheckCircle, color: '#10b981' },
            { label: 'Outstanding', value: formatCurrency(stats.outstanding), icon: Clock, color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4" style={{color: stat.color}} />
                <span className="text-xs" style={{color: 'var(--text3)'}}>{stat.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{color: 'var(--text)'}}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden" style={{border: '1px solid var(--border)'}}>
          <div className="px-6 py-4 flex items-center justify-between" style={{background: 'var(--bg2)', borderBottom: '1px solid var(--border)'}}>
            <h2 className="font-semibold" style={{color: 'var(--text)'}}>Invoices</h2>
            <span className="text-sm" style={{color: 'var(--text3)'}}>{invoices.length} total</span>
          </div>
          <div className="py-16 text-center" style={{background: 'var(--bg)'}}>
            <FileText className="w-10 h-10 mx-auto mb-3" style={{color: 'var(--text3)'}} />
            <p className="font-medium mb-1" style={{color: 'var(--text2)'}}>No invoices yet</p>
            <p className="text-sm mb-4" style={{color: 'var(--text3)'}}>Create your first invoice to get started</p>
            <Link href="/invoice/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{background: 'var(--accent)'}}>
              <Plus className="w-4 h-4" /> Create Invoice
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
