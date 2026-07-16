'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updatePrivateNotes } from '@/actions/vendor'

export default function PrivateNotes({ customerId, initialNotes }: { customerId: string, initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updatePrivateNotes(customerId, notes)
      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    } catch (e) {
      alert('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-zinc-900">Private Notes</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSave} 
          disabled={saving || notes === initialNotes}
          className="h-8 border-zinc-300 text-zinc-700 hover:bg-zinc-200"
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </Button>
      </div>
      <div className="p-4">
        <Textarea 
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="Add private notes about this customer (e.g. preferences, credit limits)..."
          className="min-h-[100px] bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
        />
      </div>
    </div>
  )
}
