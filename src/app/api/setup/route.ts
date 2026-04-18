import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { firmName, fullName } = await request.json()

  if (!firmName || !fullName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use service role to bypass RLS for initial setup
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: firm, error: firmError } = await admin
    .from('firms')
    .insert({ name: firmName })
    .select()
    .single()

  if (firmError) {
    return NextResponse.json({ error: firmError.message }, { status: 500 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: user.id, full_name: fullName, firm_id: firm.id, role: 'admin' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
