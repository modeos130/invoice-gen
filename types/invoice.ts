export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id?: string
  user_id?: string
  invoice_number: string
  client_name: string
  client_email: string
  client_address: string
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: 'draft' | 'sent' | 'paid'
  notes: string
  invoice_date: string
  due_date: string
  created_at?: string
}
