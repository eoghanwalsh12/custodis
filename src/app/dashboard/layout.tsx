import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, firms(name)')
    .eq('id', user.id)
    .single()

  const firmName = (profile?.firms as { name?: string } | null)?.name ?? 'Your Firm'
  const userName = profile?.full_name ?? user.email ?? ''

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar firmName={firmName} userName={userName} />
      <div style={{ marginLeft: '236px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
