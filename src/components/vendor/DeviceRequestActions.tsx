'use client'

import { approveDeviceRequest, rejectDeviceRequest } from '@/actions/vendor'
import { useState } from 'react'

export function DeviceRequestActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await approveDeviceRequest(requestId)
    setLoading(false)
  }

  const handleReject = async () => {
    setLoading(true)
    await rejectDeviceRequest(requestId)
    setLoading(false)
  }

  return (
    <div className="flex gap-2 mt-2">
      <button 
        onClick={handleApprove}
        disabled={loading}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs py-1.5 rounded-md transition-colors"
      >
        {loading ? '...' : 'Approve'}
      </button>
      <button 
        onClick={handleReject}
        disabled={loading}
        className="flex-1 bg-zinc-200 hover:bg-zinc-700 disabled:opacity-50 text-zinc-900 text-xs py-1.5 rounded-md transition-colors"
      >
        {loading ? '...' : 'Reject'}
      </button>
    </div>
  )
}
