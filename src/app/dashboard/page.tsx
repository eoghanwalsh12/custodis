export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Client } from '@/types/database'

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function cddStatus(client: Client): 'overdue' | 'due-soon' | 'ok' {
  if (client.cdd_status === 'overdue') return 'overdue'
  if (!client.cdd_expires_at) return 'ok'
  const expires = new Date(client.cdd_expires_at)
  const in30 = addDays(new Date(), 30)
  if (expires < new Date()) return 'overdue'
  if (expires < in30) return 'due-soon'
  return 'ok'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) redirect('/onboard')

  const firmId = profile.firm_id

  const [{ data: clients }, { data: bra }, { data: recentActivity }] = await Promise.all([
    supabase.from('clients').select('*').eq('firm_id', firmId).order('created_at', { ascending: false }),
    supabase.from('business_risk_assessments').select('*').eq('firm_id', firmId).single(),
    supabase.from('audit_log').select('*').eq('firm_id', firmId).order('created_at', { ascending: false }).limit(5),
  ])

  const allClients = clients ?? []
  const total = allClients.length
  const compliant = allClients.filter(c => c.cdd_status === 'complete').length
  const overdue = allClients.filter(c => cddStatus(c) === 'overdue').length
  const dueSoon = allClients.filter(c => cddStatus(c) === 'due-soon').length

  const braComplete = bra?.status === 'complete'
  const braReviewDue = bra?.next_review_at ? new Date(bra.next_review_at) < addDays(new Date(), 60) : true
  const missingUbo = allClients.filter(c => c.is_company && !c.source_of_funds).length

  const readinessItems = [
    { label: 'Business Risk Assessment', ok: braComplete, warn: !braComplete, fail: false },
    { label: 'Policies & Controls (PCP)', ok: braComplete, warn: false, fail: !braComplete },
    { label: 'Staff training records', ok: true, warn: false, fail: false },
    { label: `${overdue} client CDD record${overdue !== 1 ? 's' : ''} overdue`, ok: overdue === 0, warn: overdue > 0, fail: false },
    { label: 'BRA annual review due', ok: !braReviewDue, warn: braReviewDue, fail: false },
    { label: `UBO missing — ${missingUbo} matter${missingUbo !== 1 ? 's' : ''}`, ok: missingUbo === 0, warn: false, fail: missingUbo > 0 },
  ]

  const readinessScore = Math.round((readinessItems.filter(i => i.ok).length / readinessItems.length) * 100)

  const matterLabel: Record<string, string> = {
    conveyancing: 'Conveyancing', corporate: 'Corporate', probate: 'Probate',
    trusts: 'Trusts & Estates', commercial: 'Commercial', other: 'Other',
  }

  return (
    <div style={s.page}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.pageTitle}>Dashboard</div>
        <div style={s.topbarRight}>
          <Link href="/dashboard/bra" className="btn btn-ghost">
            <IconDoc />
            Generate Audit Pack
          </Link>
          <Link href="/dashboard/clients/new" className="btn btn-primary">
            <IconPlus />
            New Client
          </Link>
        </div>
      </div>

      <div style={s.content}>
        {/* Alert */}
        {overdue > 0 && (
          <div style={s.alert} className="animate-slide">
            <div style={s.alertDot} />
            <div style={s.alertText}>
              <strong>{overdue} client{overdue !== 1 ? 's' : ''}</strong> {overdue === 1 ? 'has' : 'have'} overdue CDD records — action required before next Law Society inspection.
            </div>
            <Link href="/dashboard/clients" style={s.alertLink}>Review now →</Link>
          </div>
        )}

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Clients', value: total, cls: 'neutral', sub: `${allClients.filter(c => { const d = new Date(c.created_at); const q = new Date(); q.setMonth(q.getMonth() - 3); return d > q }).length} added this quarter`, fill: Math.min(total, 100), color: 'var(--gold-dim)' },
            { label: 'Fully Compliant', value: compliant, cls: 'green', sub: `${total ? Math.round(compliant / total * 100) : 0}% of active clients`, fill: total ? compliant / total * 100 : 0, color: 'var(--green)' },
            { label: 'Review Due', value: dueSoon, cls: 'amber', sub: 'Within 30 days', fill: total ? dueSoon / total * 100 : 0, color: 'var(--amber)' },
            { label: 'Action Required', value: overdue, cls: overdue > 0 ? 'red' : 'neutral', sub: 'Overdue or incomplete CDD', fill: total ? overdue / total * 100 : 0, color: 'var(--red)' },
          ].map((stat, i) => (
            <div key={i} style={{ ...s.statCard, animationDelay: `${i * 0.05 + 0.05}s` }} className="animate-rise">
              <div style={s.statLabel}>{stat.label}</div>
              <div style={{ ...s.statValue, color: stat.cls === 'green' ? 'var(--green)' : stat.cls === 'amber' ? 'var(--amber)' : stat.cls === 'red' ? 'var(--red)' : 'var(--text-primary)' }}>{stat.value}</div>
              <div style={s.statSub}>{stat.sub}</div>
              <div style={s.statTrack}><div style={{ ...s.statFill, width: `${stat.fill}%`, background: stat.color }} className="animate-grow" /></div>
            </div>
          ))}
        </div>

        {/* Two-col */}
        <div style={s.grid2}>
          {/* Client table */}
          <div className="panel animate-rise" style={{ animationDelay: '0.25s' }}>
            <div className="panel-header">
              <div className="panel-title">Recent Clients</div>
              <Link href="/dashboard/clients" style={s.panelLink}>View all →</Link>
            </div>
            <div>
              <div style={s.tableHeader}>
                <span>Client</span>
                <span>Matter</span>
                <span>CDD Status</span>
                <span>Risk</span>
                <span>Added</span>
              </div>
              {allClients.slice(0, 6).map(client => {
                const status = cddStatus(client)
                return (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`} style={s.tableRow}>
                    <div>
                      <div style={s.clientName}>{client.full_name}</div>
                      <div style={s.clientSub}>{client.matter_description ?? ''}</div>
                    </div>
                    <div style={s.mono}>{matterLabel[client.matter_type] ?? client.matter_type}</div>
                    <div>
                      <span className={`badge ${status === 'overdue' ? 'b-red' : status === 'due-soon' ? 'b-amber' : client.cdd_status === 'complete' ? 'b-green' : 'b-amber'}`}>
                        {status === 'overdue' ? 'Overdue' : client.cdd_status === 'complete' ? 'Complete' : client.cdd_status === 'pending' ? 'Pending' : 'Incomplete'}
                      </span>
                    </div>
                    <div><span className={`risk-chip r-${client.risk_level}`}>{client.risk_level}</span></div>
                    <div style={s.mono}>{new Date(client.created_at).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </Link>
                )
              })}
              {allClients.length === 0 && (
                <div style={s.empty}>
                  No clients yet. <Link href="/dashboard/clients/new" style={{ color: 'var(--gold)' }}>Add your first client →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={s.rightCol}>
            {/* Inspection readiness */}
            <div style={{ ...s.readiness, animationDelay: '0.3s' }} className="animate-rise">
              <div style={s.readinessTop}>
                <div style={s.readinessTitle}>Inspection Readiness</div>
                <span className={`badge ${readinessScore >= 80 ? 'b-green' : readinessScore >= 60 ? 'b-amber' : 'b-red'}`}>{readinessScore} / 100</span>
              </div>
              <div style={s.divider} />
              <div style={s.scoreRing}>
                <div style={{ ...s.scoreNum, color: readinessScore >= 80 ? 'var(--green)' : readinessScore >= 60 ? 'var(--amber)' : 'var(--red)' }}>{readinessScore}</div>
                <div style={s.scoreDenom}>out of 100</div>
              </div>
              <div style={s.checklist}>
                {readinessItems.map((item, i) => (
                  <div key={i} style={s.checkItem}>
                    <div style={{ ...s.checkIcon, ...(item.ok ? s.ciOk : item.warn ? s.ciWarn : s.ciFail) }}>
                      {item.ok ? <IconCheck /> : item.warn ? <IconWarn /> : <IconX />}
                    </div>
                    <span style={{ ...s.checkLabel, color: (!item.ok) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/bra" style={s.genBtn}>
                <IconDoc />
                Generate Inspection Pack
              </Link>
            </div>

            {/* Activity */}
            <div className="panel animate-rise" style={{ animationDelay: '0.35s' }}>
              <div className="panel-header">
                <div className="panel-title">Recent Activity</div>
              </div>
              {(recentActivity ?? []).map(log => (
                <div key={log.id} style={s.actItem}>
                  <div style={{ ...s.actDot, background: log.action.includes('complete') ? 'var(--green)' : log.action.includes('add') ? 'var(--gold-dim)' : log.action.includes('expire') ? 'var(--red)' : 'var(--amber)' }} />
                  <div>
                    <div style={s.actText}>{log.action}</div>
                    <div style={s.actTime}>{new Date(log.created_at).toLocaleString('en-IE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
              {(recentActivity ?? []).length === 0 && (
                <div style={s.empty}>No activity yet.</div>
              )}
            </div>
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
  topbarRight: { display: 'flex', alignItems: 'center', gap: 10 },
  content: { padding: '28px 30px', flex: 1 },
  alert: { background: 'rgba(176,64,64,0.07)', border: '1px solid rgba(176,64,64,0.22)', borderRadius: 7, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 11, marginBottom: 26 },
  alertDot: { width: 7, height: 7, background: 'var(--red)', borderRadius: '50%', flexShrink: 0, animation: 'blink 2.2s infinite' },
  alertText: { fontSize: 12.5, color: '#C86060', lineHeight: 1.4, flex: 1 },
  alertLink: { fontSize: 11.5, color: '#C86060', whiteSpace: 'nowrap', textDecoration: 'underline', opacity: 0.8 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 },
  statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, padding: '18px 20px' },
  statLabel: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 },
  statValue: { fontFamily: 'var(--font-jetbrains), monospace', fontSize: 30, fontWeight: 500, lineHeight: 1 },
  statSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 7 },
  statTrack: { height: 2, background: 'var(--border)', borderRadius: 1, marginTop: 14, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 1 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 },
  tableHeader: { display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1fr', padding: '9px 20px', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  tableRow: { display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', cursor: 'pointer', textDecoration: 'none', color: 'inherit', transition: 'background 0.1s' },
  clientName: { fontSize: 13, fontWeight: 500 },
  clientSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  mono: { fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11.5, color: 'var(--text-secondary)' },
  empty: { padding: '24px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' },
  panelLink: { fontSize: 11.5, color: 'var(--gold-dim)', textDecoration: 'none', cursor: 'pointer' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  readiness: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, padding: '18px 20px' },
  readinessTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  readinessTitle: { fontFamily: 'var(--font-playfair), serif', fontSize: 13.5, fontWeight: 600 },
  divider: { height: 1, background: 'linear-gradient(to right, transparent, var(--border-light), transparent)', margin: '14px 0' },
  scoreRing: { display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0 16px' },
  scoreNum: { fontFamily: 'var(--font-jetbrains), monospace', fontSize: 38, fontWeight: 500, lineHeight: 1 },
  scoreDenom: { fontSize: 12, color: 'var(--text-muted)', marginTop: 3, letterSpacing: '0.08em' },
  checklist: { display: 'flex', flexDirection: 'column', gap: 9 },
  checkItem: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 },
  checkIcon: { width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ciOk: { background: 'var(--green-bg)', border: '1px solid rgba(74,155,116,0.25)', color: 'var(--green)' },
  ciWarn: { background: 'var(--amber-bg)', border: '1px solid rgba(200,137,58,0.25)', color: 'var(--amber)' },
  ciFail: { background: 'var(--red-bg)', border: '1px solid rgba(176,64,64,0.25)', color: 'var(--red)' },
  checkLabel: { flex: 1 },
  genBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', marginTop: 16, padding: 10, background: 'var(--gold-bg)', border: '1px solid rgba(200,169,110,0.18)', borderRadius: 5, color: 'var(--gold)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit' },
  actItem: { display: 'flex', gap: 11, padding: '12px 18px', borderTop: '1px solid var(--border)' },
  actDot: { width: 6, height: 6, borderRadius: '50%', marginTop: 5, flexShrink: 0 },
  actText: { fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 },
  actTime: { fontFamily: 'var(--font-jetbrains), monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 },
}

function IconDoc() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 1.5h8l3 3V14a.5.5 0 01-.5.5h-11A.5.5 0 012 14V2a.5.5 0 01.5-.5H4z"/></svg> }
function IconPlus() { return <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0v12M0 6h12"/></svg> }
function IconCheck() { return <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 5l2.5 2.5L8 3"/></svg> }
function IconWarn() { return <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d="M5 2v3.5M5 7.5v.5"/></svg> }
function IconX() { return <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l4 4M7 3l-4 4"/></svg> }
