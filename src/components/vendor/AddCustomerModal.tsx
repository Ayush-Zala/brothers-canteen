'use client'

import { useState } from 'react'
import { createCustomer } from '@/actions/vendor'
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
import { UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AddCustomerModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await createCustomer({ phone, name })

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setOpen(false)
      setPhone('')
      setName('')
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error - asChild is standard in Radix but missing in Base UI types */}
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-50 border-zinc-200 text-zinc-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a new customer profile. They will need to request device approval using this phone number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-800">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g. Rahul Sharma"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-zinc-200 text-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-800">Phone Number</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-zinc-400 font-medium">+91</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="bg-white border-zinc-200 text-zinc-900 pl-10"
              />
            </div>
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
              disabled={loading}
              className="bg-white text-zinc-950 hover:bg-zinc-200"
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
