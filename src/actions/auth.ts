'use server'

import { db } from '@/lib/db'
import { createSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function vendorLogin(email: string, password: string) {
  try {
    const vendor = await db.vendor.findUnique({
      where: { email },
    })

    if (!vendor) {
      return { error: 'Invalid email or password' }
    }

    const isValid = await bcrypt.compare(password, vendor.passwordHash)
    if (!isValid) {
      return { error: 'Invalid email or password' }
    }

    // TODO: Need to pass actual IP/userAgent from headers in Route Handler instead if needed,
    // but Next.js Server Actions don't expose req directly. Can use headers().
    await createSession(vendor.id, undefined, undefined, 'unknown', 'unknown')

    return { success: true }
  } catch (error) {
    console.error('Vendor login error:', error)
    return { error: 'Internal server error' }
  }
}
