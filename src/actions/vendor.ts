'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createCustomer(data: { phone: string; name: string }) {
  try {
    const digitsOnly = data.phone.replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      return { error: 'Please enter a valid 10-digit phone number.' }
    }

    const e164Phone = `+91${digitsOnly}`

    const existing = await db.customer.findUnique({
      where: { phone: e164Phone }
    })

    if (existing) {
      return { error: 'A customer with this phone number already exists.' }
    }

    const now = BigInt(Date.now())

    await db.customer.create({
      data: {
        phone: e164Phone,
        name: data.name,
        currentBalance: 0,
        totalCollected: 0,
        createdAt: now,
        updatedAt: now,
      }
    })

    revalidatePath('/vendor/customers')
    revalidatePath('/vendor/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Create customer error:', error)
    return { error: 'Failed to create customer.' }
  }
}

export async function approveDeviceRequest(requestId: string) {
  try {
    const request = await db.deviceApprovalRequest.findUnique({
      where: { id: requestId }
    })
    
    if (!request || request.status !== 'PENDING') return { error: 'Invalid request' }

    const customer = await db.customer.findUnique({
      where: { phone: request.phone }
    })

    if (!customer) return { error: 'Customer not found' }

    // Atomic transaction to approve and create device
    await db.$transaction([
      db.deviceApprovalRequest.update({
        where: { id: requestId },
        data: { 
          status: 'APPROVED'
        }
      }),
      db.device.create({
        data: {
          id: request.deviceId,
          customerId: customer.id,
          fingerprint: request.deviceId,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
        }
      })
    ])

    revalidatePath('/vendor/dashboard')
    
    // In a real app we'd trigger a socket event here, but since Next.js server actions 
    // run differently, we can just let the client handle it or trigger via a small route handler.
    // For now, the user will poll or we rely on the client WS if implemented.

    return { success: true }
  } catch (error) {
    console.error('Approve device error:', error)
    return { error: 'Failed to approve device.' }
  }
}

export async function rejectDeviceRequest(requestId: string) {
  try {
    await db.deviceApprovalRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    })

    revalidatePath('/vendor/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Reject device error:', error)
    return { error: 'Failed to reject device request.' }
  }
}

export async function updatePrivateNotes(customerId: string, notes: string) {
  try {
    await db.customer.update({
      where: { id: customerId },
      data: { privateNotes: notes }
    })
    
    revalidatePath(`/vendor/customers/${customerId}`)
    revalidatePath('/vendor/customers')
    return { success: true }
  } catch (error) {
    console.error('Update private notes error:', error)
    return { error: 'Failed to update private notes.' }
  }
}
