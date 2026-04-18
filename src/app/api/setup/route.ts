import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { firmName, fullName } = await request.json()

  if (!firmName || !fullName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: firm, error: firmError } = await supabase
    .from('firms')
    .insert({ name: firmName })
    .select()
    .single()

  if (firmError) {
    return NextResponse.json({ error: firmError.message }, { status: 500 })
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: fullName, firm_id: firm.id, role: 'admin' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
