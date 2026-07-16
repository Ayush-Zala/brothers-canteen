import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#333' },
  header: { marginBottom: 30, borderBottom: '1px solid #eee', paddingBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666' },
  customerInfo: { marginBottom: 30, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  infoBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  value: { fontSize: 12, fontWeight: 'bold', color: '#111' },
  table: { width: '100%', marginBottom: 30 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #111', paddingBottom: 5, marginBottom: 5 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottom: '1px solid #eee' },
  col1: { width: '35%' },
  col2: { width: '45%' },
  col3: { width: '20%', textAlign: 'right' },
  headerText: { fontWeight: 'bold', fontSize: 10 },
  footer: { marginTop: 40, borderTop: '2px solid #111', paddingTop: 15, flexDirection: 'row', justifyContent: 'flex-end' },
  totalLabel: { fontSize: 14, fontWeight: 'bold', marginRight: 20 },
  totalValue: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' } // red-500
})

import { Customer, LedgerEntry } from '@prisma/client'

const StatementDocument = ({ customer, ledgerEntries }: { customer: Customer, ledgerEntries: LedgerEntry[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Brothers Canteen</Text>
        <Text style={styles.subtitle}>Customer Statement of Account</Text>
      </View>

      <View style={styles.customerInfo}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={styles.value}>{customer.name || 'Valued Customer'}</Text>
          <Text style={styles.value}>{customer.phone}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Statement Date</Text>
          <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.col1, styles.headerText]}>Date</Text>
          <Text style={[styles.col2, styles.headerText]}>Description</Text>
          <Text style={[styles.col3, styles.headerText]}>Amount</Text>
        </View>

        {ledgerEntries.map((entry, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.col1}>{new Date(Number(entry.createdAt)).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
            <Text style={styles.col2}>{entry.referenceType === 'PURCHASE' ? 'Purchase' : 'Payment Received'}</Text>
            <Text style={styles.col3}>{entry.referenceType === 'PURCHASE' ? '+' : '-'}Rs. {entry.amount}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total Outstanding Balance:</Text>
        <Text style={styles.totalValue}>Rs. {customer.currentBalance}</Text>
      </View>
    </Page>
  </Document>
)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const customer = await db.customer.findUnique({ where: { id } })
  if (!customer) return new NextResponse('Customer not found', { status: 404 })

  const ledgerEntries = await db.ledgerEntry.findMany({
    where: { customerId: id },
    orderBy: { createdAt: 'desc' },
    take: 200
  })

  try {
    const stream = await renderToStream(<StatementDocument customer={customer} ledgerEntries={ledgerEntries} />)
    
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="statement_${customer.phone}.pdf"`
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return new NextResponse('Failed to generate PDF', { status: 500 })
  }
}
