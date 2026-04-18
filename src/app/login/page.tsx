'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [firmName, setFirmName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError || !data.user) {
      setError(signupError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    // Create firm
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .insert({ name: firmName })
      .select()
      .single()

    // If firm/profile creation fails (e.g. email not confirmed yet), send to onboard
    if (firmError) { router.push('/onboard'); return }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      firm_id: firm.id,
      role: 'admin',
    })

    if (profileError) { router.push('/onboard'); return }

    router.push('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="animate-rise">
        <div style={styles.logoWrap}>
          <div style={styles.logoWord}>Custodis</div>
          <div style={styles.logoSub}>AML Compliance Platform</div>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => setMode('login')}
          >Sign in</button>
          <button
            style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : {}) }}
            onClick={() => setMode('signup')}
          >Create account</button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={styles.form}>
          {mode === 'signup' && (
            <>
              <div style={styles.field}>
                <label className="form-label">Full name</label>
                <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Síle Murphy" />
              </div>
              <div style={styles.field}>
                <label className="form-label">Firm name</label>
                <input className="form-input" type="text" value={firmName} onChange={e => setFirmName(e.target.value)} required placeholder="Murphy & Collins Solicitors" />
              </div>
            </>
          )}

          <div style={styles.field}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@firm.ie" />
          </div>

          <div style={styles.field}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            disabled={loading}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '36px',
    width: '100%',
    maxWidth: '400px',
  },
  logoWrap: { marginBottom: '28px', textAlign: 'center' as const },
  logoWord: {
    fontFamily: 'var(--font-playfair), serif',
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.04em',
  },
  logoSub: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    marginTop: '4px',
  },
  tabs: {
    display: 'flex',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '3px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '7px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.12s',
    fontFamily: 'inherit',
  },
  tabActive: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' as const },
  error: {
    background: 'var(--red-bg)',
    border: '1px solid rgba(176,64,64,0.3)',
    borderRadius: '5px',
    padding: '9px 12px',
    fontSize: '12.5px',
    color: '#C86060',
  },
}
