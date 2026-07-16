import { verifySession } from '@/lib/session'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Download } from 'lucide-react'

export default async function VendorStatementsPage() {
  const auth = await verifySession()
  if (!auth.isAuth || !auth.vendor) redirect('/login')

  const customers = await db.customer.findMany({
    orderBy: { currentBalance: 'desc' },
  })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Generate Statements</h1>
          <p className="text-zinc-400 mt-1">Download PDF statements of account for any customer.</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/50">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Outstanding Balance</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-400">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="hover:bg-zinc-200/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900">{customer.name || 'Unnamed'}</div>
                        <div className="text-sm text-zinc-400">{customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${customer.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ₹{customer.currentBalance}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={`/vendor/customers/${customer.id}/statement`} 
                      target="_blank"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-200 hover:bg-zinc-700 border border-zinc-300 hover:border-zinc-600 rounded-md text-sm font-medium text-zinc-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      PDF Statement
                    </a>
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
