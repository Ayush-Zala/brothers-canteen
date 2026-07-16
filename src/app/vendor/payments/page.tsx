import { verifySession } from '@/lib/session'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function VendorPaymentsPage() {
  const auth = await verifySession()
  if (!auth.isAuth || !auth.vendor) redirect('/login')

  const recentPayments = await db.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      customer: true
    }
  })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Payments History</h1>
          <p className="text-zinc-400 mt-1">Global view of all recent payments received.</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/50">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {recentPayments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              recentPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-zinc-200/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-700">
                    {new Date(Number(payment.createdAt)).toLocaleString('en-IN', { 
                      day: '2-digit', month: '2-digit', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit', hour12: true 
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/vendor/customers/${payment.customerId}`} className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors">
                      {payment.customer.name || payment.customer.phone}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      SUCCESS
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-zinc-900">
                    ₹{payment.amount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
