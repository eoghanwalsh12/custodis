'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BraContent {
  firm_description: string
  services: string[]
  client_types: string[]
  geographic_risk: string
  high_risk_indicators: string
  controls: string
  training_frequency: string
  review_notes: string
}

const defaultContent: BraContent = {
  firm_description: '',
  services: [],
  client_types: [],
  geographic_risk: 'low',
  high_risk_indicators: '',
  controls: '',
  training_frequency: 'annual',
  review_notes: '',
}

const serviceOptions = [
  'Residential conveyancing',
  'Commercial conveyancing',
  'Company formation',
  'Trust creation / administration',
  'Probate & estate administration',
  'Commercial transactions',
  'Litigation involving money',
]

const clientTypeOptions = [
  'Private individuals',
  'Irish companies',
  'Foreign companies',
  'Trusts',
  'Partnerships',
  'Charities / Non-profits',
  'Politically Exposed Persons (PEPs)',
]

export default function BraPage() {
  const supabase = createClient()
  const [content, setContent] = useState<BraContent>(defaultContent)
  const [braId, setBraId] = useState<string | null>(null)
  const [status, setStatus] = useState<'draft' | 'complete'>('draft')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
      const profile = profileData as { firm_id: string | null } | null
      if (!profile?.firm_id) return

      const { data: bra } = await supabase.from('business_risk_assessments').select('*').eq('firm_id', profile.firm_id).single() as { data: { id: string; content: BraContent; status: string } | null; error: unknown }
      if (bra) {
        setBraId(bra.id)
        setContent(bra.content as BraContent || defaultContent)
        setStatus(bra.status as 'draft' | 'complete')
      }
      setLoading(false)
    }
    load()
  }, [])

  function toggleArray(field: 'services' | 'client_types', value: string) {
    setContent(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  async function save(newStatus: 'draft' | 'complete') {
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profileData } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
    const profile = profileData as { firm_id: string | null } | null
    if (!profile?.firm_id) return

    const now = new Date()
    const nextYear = new Date(now)
    nextYear.setFullYear(nextYear.getFullYear() + 1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    if (braId) {
      await db.from('business_risk_assessments').update({
        content,
        status: newStatus,
        last_reviewed_at: now.toISOString(),
        next_review_at: nextYear.toISOString(),
        updated_by: user.id,
        updated_at: now.toISOString(),
      }).eq('id', braId)
    } else {
      const { data } = await db.from('business_risk_assessments').insert({
        firm_id: profile.firm_id,
        content,
        status: newStatus,
        last_reviewed_at: now.toISOString(),
        next_review_at: nextYear.toISOString(),
        updated_by: user.id,
      }).select().single()
      if (data) setBraId(data.id)
    }

    setStatus(newStatus)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <div style={s.pageTitle}>Business Risk Assessment</div>
          <div style={s.topbarSub}>Law Society of Ireland — Annual Compliance Requirement</div>
        </div>
        <div style={s.topbarRight}>
          {saved && <span style={s.savedBadge}>✓ Saved</span>}
          <button className="btn btn-ghost" onClick={() => save('draft')} disabled={saving}>Save draft</button>
          <button className="btn btn-primary" onClick={() => save('complete')} disabled={saving}>
            {saving ? 'Saving…' : status === 'complete' ? '✓ Complete — Update' : 'Mark Complete'}
          </button>
        </div>
      </div>

      <div style={s.content}>
        <div style={s.intro}>
          <div style={s.introIcon}>§</div>
          <div>
            <div style={s.introTitle}>What this document is</div>
            <div style={s.introText}>Under Regulation 30 of the Criminal Justice (Money Laundering) Regulations 2019, every designated person (including solicitors) must conduct and document a Business Risk Assessment. This document will be reviewed during a Law Society inspection. Complete all sections and review annually.</div>
          </div>
        </div>

        {/* Section 1 */}
        <Section title="1. Firm Description" subtitle="Describe your practice, its structure and size.">
          <textarea
            className="form-textarea"
            value={content.firm_description}
            onChange={e => setContent(prev => ({ ...prev, firm_description: e.target.value }))}
            placeholder="e.g. Murphy & Collins is a two-partner general practice established in 2003, based in Cork city. The firm has 4 staff including 2 qualified solicitors, 1 legal executive and 1 receptionist. We operate exclusively in Ireland."
            style={{ minHeight: 120 }}
          />
        </Section>

        {/* Section 2 */}
        <Section title="2. Services Provided" subtitle="Select all services your firm provides that are within scope of AML legislation.">
          <div style={s.checkGrid}>
            {serviceOptions.map(opt => (
              <label key={opt} style={{ ...s.checkOpt, ...(content.services.includes(opt) ? s.checkOptActive : {}) }}>
                <input type="checkbox" checked={content.services.includes(opt)} onChange={() => toggleArray('services', opt)} style={{ accentColor: 'var(--gold)', marginRight: 8 }} />
                {opt}
              </label>
            ))}
          </div>
        </Section>

        {/* Section 3 */}
        <Section title="3. Client Types" subtitle="Select all categories of clients your firm typically acts for.">
          <div style={s.checkGrid}>
            {clientTypeOptions.map(opt => (
              <label key={opt} style={{ ...s.checkOpt, ...(content.client_types.includes(opt) ? s.checkOptActive : {}) }}>
                <input type="checkbox" checked={content.client_types.includes(opt)} onChange={() => toggleArray('client_types', opt)} style={{ accentColor: 'var(--gold)', marginRight: 8 }} />
                {opt}
              </label>
            ))}
          </div>
        </Section>

        {/* Section 4 */}
        <Section title="4. Geographic Risk" subtitle="Assess the overall geographic risk of your client base.">
          <div style={s.radioGroup}>
            {[
              { v: 'low', l: 'Low', d: 'Predominantly domestic Irish clients with no significant international exposure' },
              { v: 'medium', l: 'Medium', d: 'Mix of domestic and international clients; some exposure to higher-risk jurisdictions' },
              { v: 'high', l: 'High', d: 'Significant international client base or exposure to high-risk third countries' },
            ].map(opt => (
              <label key={opt.v} style={{ ...s.radioOpt, ...(content.geographic_risk === opt.v ? s.radioOptActive : {}) }}>
                <input type="radio" name="geo" checked={content.geographic_risk === opt.v} onChange={() => setContent(prev => ({ ...prev, geographic_risk: opt.v }))} style={{ accentColor: 'var(--gold)', marginRight: 10 }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{opt.l} risk</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{opt.d}</div>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Section 5 */}
        <Section title="5. High-Risk Indicators" subtitle="Describe any factors that elevate the overall risk profile of your practice.">
          <textarea
            className="form-textarea"
            value={content.high_risk_indicators}
            onChange={e => setContent(prev => ({ ...prev, high_risk_indicators: e.target.value }))}
            placeholder="e.g. The firm acts for a small number of corporate clients in property transactions. Some clients have introduced themselves via referral from overseas contacts. The firm does not act for PEPs as a matter of policy."
            style={{ minHeight: 100 }}
          />
        </Section>

        {/* Section 6 */}
        <Section title="6. Controls & Procedures" subtitle="Describe the controls your firm has in place to mitigate AML risk.">
          <textarea
            className="form-textarea"
            value={content.controls}
            onChange={e => setContent(prev => ({ ...prev, controls: e.target.value }))}
            placeholder="e.g. All new clients are subject to identity verification before work commences. Client files include copies of photographic ID and proof of address. Compliance officer designated: [name]. Suspicious transaction reporting procedure is in place. Staff trained annually."
            style={{ minHeight: 120 }}
          />
        </Section>

        {/* Section 7 */}
        <Section title="7. Staff Training" subtitle="Frequency of AML training provided to staff.">
          <select className="form-select" value={content.training_frequency} onChange={e => setContent(prev => ({ ...prev, training_frequency: e.target.value }))} style={{ maxWidth: 300 }}>
            <option value="annual">Annually</option>
            <option value="biannual">Every 6 months</option>
            <option value="quarterly">Quarterly</option>
            <option value="on-appointment">On appointment only</option>
          </select>
        </Section>

        {/* Section 8 */}
        <Section title="8. Review Notes" subtitle="Record any observations from this review period.">
          <textarea
            className="form-textarea"
            value={content.review_notes}
            onChange={e => setContent(prev => ({ ...prev, review_notes: e.target.value }))}
            placeholder="e.g. This BRA was reviewed on [date] by [name]. No material changes to the firm's risk profile since last review. Updated following introduction of new conveyancing matter types."
            style={{ minHeight: 80 }}
          />
        </Section>

        <div style={s.footNote}>
          <strong>Reminder:</strong> This document must be reviewed and updated at least annually, and whenever there is a material change to your practice. A copy must be available for inspection by the Law Society of Ireland at any time.
        </div>
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={sec.wrap}>
      <div style={sec.header}>
        <div style={sec.title}>{title}</div>
        <div style={sec.sub}>{subtitle}</div>
      </div>
      <div style={sec.body}>{children}</div>
    </div>
  )
}

const sec: Record<string, React.CSSProperties> = {
  wrap: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, marginBottom: 16, overflow: 'hidden' },
  header: { padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' },
  title: { fontFamily: 'var(--font-playfair), serif', fontSize: 14, fontWeight: 600 },
  sub: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 },
  body: { padding: 20 },
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  topbar: { background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 30px', position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 },
  pageTitle: { fontFamily: 'var(--font-playfair), serif', fontSize: 16, fontWeight: 600 },
  topbarSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 10 },
  savedBadge: { fontSize: 12, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid rgba(74,155,116,0.2)', padding: '4px 10px', borderRadius: 4 },
  content: { padding: '28px 30px', flex: 1, maxWidth: 800, margin: '0 auto', width: '100%' },
  intro: { display: 'flex', gap: 16, background: 'var(--gold-bg)', border: '1px solid rgba(200,169,110,0.15)', borderRadius: 7, padding: 20, marginBottom: 24 },
  introIcon: { fontFamily: 'var(--font-playfair), serif', fontSize: 28, color: 'var(--gold-dim)', lineHeight: 1, flexShrink: 0, marginTop: 2 },
  introTitle: { fontFamily: 'var(--font-playfair), serif', fontSize: 14, fontWeight: 600, marginBottom: 6 },
  introText: { fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 },
  checkGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  checkOpt: { display: 'flex', alignItems: 'center', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 13, cursor: 'pointer', transition: 'all 0.12s' },
  checkOptActive: { background: 'var(--gold-bg)', borderColor: 'rgba(200,169,110,0.25)', color: 'var(--text-primary)' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  radioOpt: { display: 'flex', alignItems: 'flex-start', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s' },
  radioOptActive: { background: 'var(--gold-bg)', borderColor: 'rgba(200,169,110,0.25)' },
  footNote: { background: 'var(--amber-bg)', border: '1px solid rgba(200,137,58,0.2)', borderRadius: 7, padding: '14px 18px', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 },
}
