export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address: string;
  client_id: string;
  line_items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: InvoiceStatus;
  notes: string;
  invoice_date: string;
  due_date: string;
  created_at: string;
}
