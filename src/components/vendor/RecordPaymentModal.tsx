'use client'

import { useState } from 'react'
import { addPayment } from '@/actions/ledger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreditCard } from 'lucide-react'

export default function RecordPaymentModal({ customerId, customerName, pendingBalance }: { customerId: string, customerName: string, pendingBalance: number }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const parsedAmount = parseInt(amount, 10)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.')
      setLoading(false)
      return
    }

    const res = await addPayment(customerId, parsedAmount)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setOpen(false)
      setAmount('')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error - asChild missing in Base UI types */}
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-zinc-900 gap-2 shadow-sm">
          <CreditCard className="h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-50 border-zinc-200 text-zinc-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter the amount {customerName} paid. This will automatically be allocated via FIFO to their oldest unpaid purchases.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-white border border-zinc-200 rounded-lg p-4 my-2 text-center">
          <div className="text-xs text-zinc-400 font-medium">Current Outstanding</div>
          <div className="text-2xl font-bold text-red-400 mt-1">₹{pendingBalance}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-zinc-800">Amount Received (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 500"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white border-zinc-200 text-zinc-900 text-lg h-12"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm font-medium bg-red-950/50 p-3 rounded-md border border-red-900/50">
              {error}
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-zinc-300 text-zinc-700 hover:bg-zinc-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !amount}
              className="bg-indigo-600 text-zinc-900 hover:bg-indigo-700"
            >
              {loading ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
