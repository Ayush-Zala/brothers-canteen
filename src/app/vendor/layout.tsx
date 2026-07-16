import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import VendorLayoutClient from '@/components/vendor/VendorLayoutClient'

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await verifySession()

  if (!auth.isAuth || !auth.vendor) {
    redirect('/login')
  }

  return <VendorLayoutClient>{children}</VendorLayoutClient>
}
