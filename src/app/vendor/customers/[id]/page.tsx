import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react'
import RecordPaymentModal from '@/components/vendor/RecordPaymentModal'
import PrivateNotes from '@/components/vendor/PrivateNotes'

export default async function CustomerLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const customer = await db.customer.findUnique({
    where: { id }
  })

  if (!customer) return notFound()

  // Fetch the ledger entries for chronological timeline
  const timeline = await db.ledgerEntry.findMany({
    where: { customerId: id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendor/customers" className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 text-zinc-400" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{customer.name}</h2>
            <p className="text-zinc-400 text-sm">{customer.phone}</p>
          </div>
        </div>
        <a 
          href={`/vendor/customers/${customer.id}/statement`}
          target="_blank"
          className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-700 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-300"
        >
          <FileText className="h-4 w-4" />
          Statement
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
          <div className="text-sm font-medium text-zinc-400">Total Outstanding</div>
          <div className="text-3xl font-bold text-red-400 mt-2">₹{customer.currentBalance}</div>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-400">Total Collected Lifetime</div>
            <div className="text-xl font-semibold text-emerald-500 mt-1">₹{customer.totalCollected}</div>
          </div>
          <div className="flex justify-end mt-4">
            <RecordPaymentModal 
              customerId={customer.id} 
              customerName={customer.name || 'Customer'} 
              pendingBalance={customer.currentBalance} 
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="font-semibold text-zinc-900">Chronological Timeline</h3>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {timeline.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">
              No activity found for this customer yet.
            </div>
          ) : (
            timeline.map(event => {
              const isPurchase = event.referenceType === 'PURCHASE'
              const Icon = isPurchase ? ArrowUpRight : ArrowDownRight
              const iconColor = isPurchase ? 'text-red-400' : 'text-emerald-400'
              const amountColor = isPurchase ? 'text-red-400' : 'text-emerald-400'
              const bgColor = isPurchase ? 'bg-red-400/10' : 'bg-emerald-400/10'

              return (
                <div key={event.id} className="p-4 flex items-center justify-between hover:bg-zinc-200/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${bgColor}`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div>
                      <div className="font-medium text-zinc-800">
                        {isPurchase ? 'Purchase' : 'Payment Received'}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {new Date(Number(event.createdAt)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold text-lg ${amountColor}`}>
                    {isPurchase ? '+' : '-'}₹{event.amount}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <PrivateNotes customerId={customer.id} initialNotes={customer.privateNotes} />
    </div>
  )
}
