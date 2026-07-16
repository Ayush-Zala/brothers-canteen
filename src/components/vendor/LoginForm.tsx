'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { vendorLogin } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await vendorLogin(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/vendor/dashboard')
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="email" className="text-zinc-800">
          Email address
        </Label>
        <div className="mt-2">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-zinc-800">
          Password
        </Label>
        <div className="mt-2">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm font-medium bg-red-950/50 p-3 rounded-md border border-red-900/50">
          {error}
        </div>
      )}

      <div>
        <Button 
          type="submit" 
          className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </form>
  )
}
