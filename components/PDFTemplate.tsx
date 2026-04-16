'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Invoice } from '@/types/invoice'
import { formatCurrency, formatDate } from '@/lib/invoice-utils'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  companyName: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  companyDetails: { fontSize: 10, color: '#64748b', marginTop: 4 },
  invoiceTitle: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: '#2563eb', textAlign: 'right' },
  invoiceMeta: { fontSize: 10, color: '#64748b', textAlign: 'right', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  billTo: { fontSize: 12, color: '#1e293b' },
  table: { marginBottom: 24 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 8, borderRadius: 4 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  headerText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#64748b' },
  cellText: { fontSize: 10, color: '#1e293b' },
  totalsSection: { alignItems: 'flex-end', marginTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { fontSize: 10, color: '#64748b', width: 100, textAlign: 'right', marginRight: 16 },
  totalValue: { fontSize: 10, color: '#1e293b', width: 80, textAlign: 'right' },
  grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, padding: 8, backgroundColor: '#2563eb', borderRadius: 4 },
  grandTotalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#ffffff', width: 100, textAlign: 'right', marginRight: 16 },
  grandTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#ffffff', width: 80, textAlign: 'right' },
  notes: { marginTop: 32, padding: 12, backgroundColor: '#f8fafc', borderRadius: 4 },
  notesText: { fontSize: 10, color: '#64748b' },
  footer: { position: 'absolute', bottom: 32, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 },
})

export function PDFTemplate({ invoice }: { invoice: Invoice }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Booman Systems LLC</Text>
            <Text style={styles.companyDetails}>admin@modeos.app</Text>
            <Text style={styles.companyDetails}>boomanlab.com</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>#{invoice.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>Date: {formatDate(invoice.invoice_date)}</Text>
            <Text style={styles.invoiceMeta}>Due: {formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.billTo}>{invoice.client_name}</Text>
          {invoice.client_email ? <Text style={[styles.billTo, { color: '#64748b', fontSize: 10 }]}>{invoice.client_email}</Text> : null}
          {invoice.client_address ? <Text style={[styles.billTo, { color: '#64748b', fontSize: 10, marginTop: 4 }]}>{invoice.client_address}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.col1]}>Description</Text>
            <Text style={[styles.headerText, styles.col2]}>Qty</Text>
            <Text style={[styles.headerText, styles.col3]}>Rate</Text>
            <Text style={[styles.headerText, styles.col4]}>Amount</Text>
          </View>
          {invoice.line_items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.col1]}>{item.description}</Text>
              <Text style={[styles.cellText, styles.col2]}>{String(item.quantity)}</Text>
              <Text style={[styles.cellText, styles.col3]}>{formatCurrency(item.rate)}</Text>
              <Text style={[styles.cellText, styles.col4]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.tax_rate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({String(invoice.tax_rate)}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>Thank you for your business — Powered by I Hate Invoices</Text>
      </Page>
    </Document>
  )
}
