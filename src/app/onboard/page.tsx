'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardPage() {
  const router = useRouter()
  const [firmName, setFirmName] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.firm_id) { router.replace('/dashboard'); return }
      if (profile?.full_name) setFullName(profile.full_name)
      setChecking(false)
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .insert({ name: firmName })
      .select()
      .single()

    if (firmError) { setError(firmError.message); setLoading(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName, firm_id: firm.id, role: 'admin' })

    if (profileError) { setError(profileError.message); setLoading(false); return }

    router.replace('/dashboard')
  }

  if (checking) {
    return (
      <div style={s.page}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card} className="animate-rise">
        <div style={s.logoWrap}>
          <div style={s.logoWord}>Custodis</div>
          <div style={s.logoSub}>AML Compliance Platform</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Set up your firm</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This takes 30 seconds. You can change these details later.</div>
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label className="form-label">Your full name</label>
            <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Síle Murphy" />
          </div>
          <div style={s.field}>
            <label className="form-label">Firm name</label>
            <input className="form-input" type="text" value={firmName} onChange={e => setFirmName(e.target.value)} required placeholder="Murphy & Collins Solicitors" />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 10 }} disabled={loading}>
            {loading ? 'Creating…' : 'Continue to dashboard →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 36, width: '100%', maxWidth: 400 },
  logoWrap: { marginBottom: 28, textAlign: 'center' },
  logoWord: { fontFamily: 'var(--font-playfair), serif', fontSize: 26, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.04em' },
  logoSub: { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column' },
  error: { background: 'var(--red-bg)', border: '1px solid rgba(176,64,64,0.3)', borderRadius: 5, padding: '9px 12px', fontSize: 12.5, color: '#C86060' },
}
