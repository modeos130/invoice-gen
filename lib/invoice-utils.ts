import { LineItem } from '@/types/invoice'

export function generateInvoiceNumber(lastNumber?: number): string {
  const num = (lastNumber || 0) + 1
  return `INV-${String(num).padStart(4, '0')}`
}

export function calculateTotals(items: LineItem[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount
  return { subtotal, taxAmount, total }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
