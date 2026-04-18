'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { MatterType, RiskLevel } from '@/types/database'

type Step = 1 | 2 | 3

interface FormData {
  full_name: string
  email: string
  matter_type: MatterType
  matter_description: string
  is_company: boolean
  pep: boolean
  source_of_funds: string
  notes: string
  risk_level: RiskLevel
}

const initial: FormData = {
  full_name: '', email: '', matter_type: 'conveyancing', matter_description: '',
  is_company: false, pep: false, source_of_funds: '', notes: '', risk_level: 'low',
}

function computeRisk(form: FormData): RiskLevel {
  if (form.pep) return 'high'
  if (form.is_company) return 'medium'
  if (['trusts', 'corporate'].includes(form.matter_type)) return 'medium'
  return 'low'
}

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function next() {
    if (step === 1 && !form.full_name) { setError('Client name is required'); return }
    setError('')
    setStep(s => (s + 1) as Step)
    if (step === 2) {
      const auto = computeRisk(form)
      setForm(prev => ({ ...prev, risk_level: auto }))
    }
  }

  async function submit() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
    if (!profile?.firm_id) { setError('Profile not found'); setLoading(false); return }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const { data: client, error: err } = await supabase.from('clients').insert({
      firm_id: profile.firm_id,
      full_name: form.full_name,
      email: form.email || null,
      matter_type: form.matter_type,
      matter_description: form.matter_description || null,
      is_company: form.is_company,
      pep: form.pep,
      source_of_funds: form.source_of_funds || null,
      notes: form.notes || null,
      risk_level: form.risk_level,
      cdd_status: 'pending',
      cdd_expires_at: expiresAt.toISOString(),
      created_by: user.id,
    }).select().single()

    if (err) { setError(err.message); setLoading(false); return }

    await supabase.from('audit_log').insert({
      firm_id: profile.firm_id,
      user_id: user.id,
      action: `New client added — ${form.full_name}`,
      entity_type: 'client',
      entity_id: client.id,
    })

    router.push(`/dashboard/clients/${client.id}`)
  }

  const steps = [
    { n: 1, label: 'Client details' },
    { n: 2, label: 'Risk assessment' },
    { n: 3, label: 'Review & save' },
  ]

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div style={s.pageTitle}>New Client</div>
        <Link href="/dashboard/clients" className="btn btn-ghost">Cancel</Link>
      </div>

      <div style={s.content}>
        {/* Step indicator */}
        <div style={s.steps}>
          {steps.map((st, i) => (
            <div key={st.n} style={s.stepItem}>
              <div style={{ ...s.stepDot, ...(step === st.n ? s.stepActive : step > st.n ? s.stepDone : {}) }}>
                {step > st.n ? <IconCheck /> : st.n}
              </div>
              <div style={{ ...s.stepLabel, color: step === st.n ? 'var(--text-primary)' : 'var(--text-muted)' }}>{st.label}</div>
              {i < steps.length - 1 && <div style={s.stepLine} />}
            </div>
          ))}
        </div>

        <div style={s.formCard} className="panel animate-rise">
          {/* Step 1: Client details */}
          {step === 1 && (
            <div style={s.stepContent}>
              <div style={s.stepHeading}>Client Information</div>
              <div style={s.stepDesc}>Enter the client's basic details. All information is stored securely and retained for 5 years as required by the CJ(ML&TF) Act 2010.</div>

              <div style={s.fieldGrid}>
                <div style={s.fieldFull}>
                  <label className="form-label">Client name *</label>
                  <input className="form-input" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Full legal name (individual or company name)" />
                </div>
                <div>
                  <label className="form-label">Email address</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="client@email.com" />
                </div>
                <div>
                  <label className="form-label">Matter type *</label>
                  <select className="form-select" value={form.matter_type} onChange={e => update('matter_type', e.target.value as MatterType)}>
                    <option value="conveyancing">Conveyancing</option>
                    <option value="corporate">Corporate</option>
                    <option value="probate">Probate</option>
                    <option value="trusts">Trusts & Estates</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={s.fieldFull}>
                  <label className="form-label">Matter description</label>
                  <textarea className="form-textarea" value={form.matter_description} onChange={e => update('matter_description', e.target.value)} placeholder="Brief description of the matter (e.g. Residential purchase at 12 Main St, Cork)" />
                </div>
              </div>

              <div style={s.checkboxRow}>
                <label style={s.checkboxLabel}>
                  <input type="checkbox" checked={form.is_company} onChange={e => update('is_company', e.target.checked)} style={s.checkbox} />
                  This client is a company or legal entity
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Risk assessment */}
          {step === 2 && (
            <div style={s.stepContent}>
              <div style={s.stepHeading}>Risk Assessment</div>
              <div style={s.stepDesc}>Complete the customer due diligence risk assessment. This is recorded in your compliance file and visible during Law Society inspections.</div>

              <div style={s.fieldGrid}>
                <div style={s.fieldFull}>
                  <label className="form-label">Politically Exposed Person (PEP)?</label>
                  <div style={s.radioGroup}>
                    {[{v: false, l: 'No — standard client'}, {v: true, l: 'Yes — enhanced due diligence required'}].map(opt => (
                      <label key={String(opt.v)} style={{ ...s.radioLabel, ...(form.pep === opt.v ? s.radioActive : {}) }}>
                        <input type="radio" name="pep" checked={form.pep === opt.v} onChange={() => update('pep', opt.v)} style={{ marginRight: 8 }} />
                        {opt.l}
                      </label>
                    ))}
                  </div>
                  <div style={s.fieldHint}>A PEP is a person who holds or has held a prominent public function — politicians, senior officials, senior military.</div>
                </div>

                <div style={s.fieldFull}>
                  <label className="form-label">Source of funds</label>
                  <select className="form-select" value={form.source_of_funds} onChange={e => update('source_of_funds', e.target.value)}>
                    <option value="">Select source of funds…</option>
                    <option value="employment">Employment / salary</option>
                    <option value="business">Business income</option>
                    <option value="savings">Savings</option>
                    <option value="inheritance">Inheritance</option>
                    <option value="property-sale">Property sale proceeds</option>
                    <option value="investment">Investment returns</option>
                    <option value="gift">Gift</option>
                    <option value="other">Other — explain in notes</option>
                  </select>
                </div>

                <div style={s.fieldFull}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any additional observations relevant to this client's risk profile…" style={{ minHeight: 100 }} />
                </div>

                <div style={s.fieldFull}>
                  <label className="form-label">Risk level (auto-assessed)</label>
                  <div style={s.riskDisplay}>
                    <span className={`risk-chip r-${computeRisk(form)}`} style={{ fontSize: 13, padding: '6px 16px' }}>{computeRisk(form).toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 12 }}>
                      {computeRisk(form) === 'high' ? 'PEP detected — enhanced due diligence required.' : computeRisk(form) === 'medium' ? 'Company client or high-risk matter type.' : 'Standard client profile.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div style={s.stepContent}>
              <div style={s.stepHeading}>Review & Complete</div>
              <div style={s.stepDesc}>Review the CDD record before saving. Once saved, this is logged to your compliance audit trail.</div>

              <div style={s.reviewGrid}>
                {[
                  ['Client name', form.full_name],
                  ['Email', form.email || '—'],
                  ['Matter type', form.matter_type],
                  ['Matter description', form.matter_description || '—'],
                  ['Company client', form.is_company ? 'Yes' : 'No'],
                  ['PEP', form.pep ? 'Yes — enhanced DD required' : 'No'],
                  ['Source of funds', form.source_of_funds || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={s.reviewRow}>
                    <div style={s.reviewKey}>{k}</div>
                    <div style={s.reviewVal}>{v}</div>
                  </div>
                ))}
                <div style={s.reviewRow}>
                  <div style={s.reviewKey}>Risk level</div>
                  <div><span className={`risk-chip r-${form.risk_level}`}>{form.risk_level.toUpperCase()}</span></div>
                </div>
              </div>

              <div style={s.complianceNote}>
                <IconShield />
                <span>This CDD record will be stored securely and retained for 5 years post-transaction as required under s.55 CJ(ML&TF) Act 2010.</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div style={s.error}>{error}</div>}

          {/* Navigation */}
          <div style={s.navRow}>
            {step > 1 && (
              <button className="btn btn-ghost" onClick={() => setStep(s => (s - 1) as Step)}>← Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button className="btn btn-primary" onClick={next}>Continue →</button>
            ) : (
              <button className="btn btn-primary" onClick={submit} disabled={loading}>
                {loading ? 'Saving…' : 'Save CDD Record'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  topbar: { height: 56, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 },
  pageTitle: { fontFamily: 'var(--font-playfair), serif', fontSize: 16, fontWeight: 600 },
  content: { padding: '28px 30px', flex: 1, maxWidth: 720, margin: '0 auto', width: '100%' },
  steps: { display: 'flex', alignItems: 'center', marginBottom: 28, gap: 0 },
  stepItem: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepActive: { background: 'var(--gold-bg)', border: '1px solid rgba(200,169,110,0.3)', color: 'var(--gold)' },
  stepDone: { background: 'var(--green-bg)', border: '1px solid rgba(74,155,116,0.3)', color: 'var(--green)' },
  stepLabel: { fontSize: 12, fontWeight: 500 },
  stepLine: { flex: 1, height: 1, background: 'var(--border)', margin: '0 8px' },
  formCard: { padding: 0 },
  stepContent: { padding: 28 },
  stepHeading: { fontFamily: 'var(--font-playfair), serif', fontSize: 18, fontWeight: 600, marginBottom: 8 },
  stepDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24 },
  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fieldFull: { gridColumn: '1 / -1' },
  checkboxRow: { marginTop: 16 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' },
  checkbox: { width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--gold)' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  radioLabel: { display: 'flex', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: 13, cursor: 'pointer', transition: 'all 0.12s' },
  radioActive: { background: 'var(--gold-bg)', borderColor: 'rgba(200,169,110,0.3)', color: 'var(--gold)' },
  fieldHint: { fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 },
  riskDisplay: { display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6 },
  reviewGrid: { display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden', marginBottom: 20 },
  reviewRow: { display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center' },
  reviewKey: { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  reviewVal: { fontSize: 13, color: 'var(--text-primary)' },
  complianceNote: { display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--gold-bg)', border: '1px solid rgba(200,169,110,0.15)', borderRadius: 6, padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 },
  error: { margin: '0 28px', background: 'var(--red-bg)', border: '1px solid rgba(176,64,64,0.3)', borderRadius: 5, padding: '9px 12px', fontSize: 12.5, color: '#C86060' },
  navRow: { display: 'flex', alignItems: 'center', padding: '16px 28px', borderTop: '1px solid var(--border)', gap: 12 },
}

function IconCheck() { return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 5l2.5 2.5L8 3"/></svg> }
function IconShield() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, color: 'var(--gold-dim)' }}><path d="M8 1L1 5v4c0 3.3 3 6 7 6.5C15 15 15 9 15 9V5L8 1z"/></svg> }
