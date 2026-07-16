import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, IndianRupee, Activity, TrendingUp } from 'lucide-react'
import { DeviceRequestActions } from '@/components/vendor/DeviceRequestActions'

export default async function VendorDashboard() {
  // Fetch high-level stats
  const customersCount = await db.customer.count({ where: { archivedAt: null } })
  
  // In a real app we'd fetch from DailySummary/MonthlySummary. 
  // We'll aggregate pending balances directly for now.
  const allCustomers = await db.customer.findMany({ select: { currentBalance: true }})
  const totalPending = allCustomers.reduce((acc, c) => acc + c.currentBalance, 0)

  // Fetch real pending requests
  const pendingRequests = await db.deviceApprovalRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { requestedAt: 'desc' },
    take: 10
  })

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-50 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Outstanding</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">₹{totalPending}</div>
            <p className="text-xs text-zinc-400 mt-1">
              Across {customersCount} active customers
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-50 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{customersCount}</div>
            <p className="text-xs text-zinc-400 mt-1">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-50 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Today&apos;s Collections</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">₹0</div>
            <p className="text-xs text-zinc-400 mt-1">
              0 payments recorded today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-50 border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Device Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{pendingRequests.length}</div>
            <p className="text-xs text-zinc-400 mt-1">
              Pending approvals
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-50 border-zinc-200">
          <CardHeader>
            <CardTitle className="text-zinc-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-400">
              No recent timeline events found. The WebSocket server will populate this in real-time.
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-zinc-50 border-zinc-200">
          <CardHeader>
            <CardTitle className="text-zinc-900">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="text-sm text-zinc-400">No devices pending approval.</div>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className="flex flex-col gap-2 p-3 rounded-md bg-white border border-zinc-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{req.phone}</div>
                        <div className="text-xs text-zinc-400">{req.browser} on {req.os}</div>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {new Date(Number(req.requestedAt)).toLocaleTimeString()}
                      </div>
                    </div>
                    <DeviceRequestActions requestId={req.id} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
