'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestDeviceApproval } from '@/actions/customer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CustomerLoginForm() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'ERROR'>('IDLE')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('IDLE')
    setErrorMsg('')
    
    // In a real app we'd gather browser/OS info using navigator.userAgent
    // and generate a pseudo deviceId/fingerprint in local storage.
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem('deviceId', deviceId)
    }

    const browserInfo = navigator.userAgent

    const res = await requestDeviceApproval({
      phone,
      deviceId,
      browser: browserInfo,
      os: navigator.platform,
      ip: 'Client IP' // Filled by server action
    })

    if (res.error) {
      setStatus('ERROR')
      setErrorMsg(res.error)
    } else if (res.redirect) {
      router.push(res.redirect)
    } else {
      setStatus('PENDING')
    }
  }

  // Poll for approval if in pending state
  // ... (for a real production app we would poll or use socket here)

  if (status === 'PENDING') {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium text-zinc-900">Approval Pending</h3>
        <p className="text-sm text-zinc-400">
          Your request has been sent to the vendor. Please wait for them to approve this device.
        </p>
        <p className="text-xs text-zinc-400 animate-pulse">
          Waiting for approval...
        </p>
        <Button 
          variant="outline" 
          onClick={() => setStatus('IDLE')}
          className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-200"
        >
          Cancel or Try Another Number
        </Button>
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="phone" className="text-zinc-800">
          Phone Number
        </Label>
        <div className="mt-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-zinc-400 font-medium">+91</span>
          </div>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="9876543210"
            required
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 pl-10"
          />
        </div>
      </div>

      {status === 'ERROR' && (
        <div className="text-red-500 text-sm font-medium bg-red-950/50 p-3 rounded-md border border-red-900/50">
          {errorMsg}
        </div>
      )}

      <div>
        <Button 
          type="submit" 
          className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold"
        >
          Request Access
        </Button>
      </div>
    </form>
  )
}
