import { db } from '@/lib/db'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AddCustomerModal from '@/components/vendor/AddCustomerModal'

export default async function CustomersPage() {
  const customers = await db.customer.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Customers</h2>
        <AddCustomerModal />
      </div>

      <Card className="bg-zinc-50 border-zinc-200">
        <CardHeader>
          <CardTitle className="text-zinc-900 text-lg">Active Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="border-zinc-200 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Phone</TableHead>
                <TableHead className="text-zinc-400 text-right">Pending Balance</TableHead>
                <TableHead className="text-zinc-400 text-right">Total Collected</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow className="border-zinc-200">
                  <TableCell colSpan={5} className="text-center text-zinc-400 py-8">
                    No customers found. Add your first customer to get started.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className="border-zinc-200 hover:bg-zinc-200/50">
                    <TableCell className="font-medium text-zinc-800">{c.name}</TableCell>
                    <TableCell className="text-zinc-400">{c.phone}</TableCell>
                    <TableCell className="text-right text-emerald-500 font-medium">₹{c.currentBalance}</TableCell>
                    <TableCell className="text-right text-zinc-700">₹{c.totalCollected}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/vendor/customers/${c.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                        View Ledger
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
