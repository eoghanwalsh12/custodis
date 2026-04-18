import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('firm_id').eq('id', user.id).single()
  if (!profile?.firm_id) redirect('/dashboard')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('firm_id', profile.firm_id)
    .order('created_at', { ascending: false })

  const all = clients ?? []

  const matterLabel: Record<string, string> = {
    conveyancing: 'Conveyancing', corporate: 'Corporate', probate: 'Probate',
    trusts: 'Trusts & Estates', commercial: 'Commercial', other: 'Other',
  }

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div style={s.pageTitle}>Clients</div>
        <Link href="/dashboard/clients/new" className="btn btn-primary">
          <IconPlus />
          New Client
        </Link>
      </div>

      <div style={s.content}>
        <div className="panel animate-rise">
          <div className="panel-header">
            <div className="panel-title">All Clients ({all.length})</div>
          </div>
          <div style={s.tableHeader}>
            <span>Client</span>
            <span>Matter type</span>
            <span>CDD status</span>
            <span>Risk</span>
            <span>CDD expires</span>
            <span>Added</span>
          </div>
          {all.map(client => {
            const expired = client.cdd_expires_at && new Date(client.cdd_expires_at) < new Date()
            const dueSoon = client.cdd_expires_at && !expired && new Date(client.cdd_expires_at) < new Date(Date.now() + 30 * 86400000)
            const statusClass = expired || client.cdd_status === 'overdue' ? 'b-red' : dueSoon || client.cdd_status === 'pending' ? 'b-amber' : 'b-green'
            const statusLabel = expired ? 'Overdue' : client.cdd_status === 'complete' ? 'Complete' : 'Pending'

            return (
              <Link key={client.id} href={`/dashboard/clients/${client.id}`} style={s.tableRow}>
                <div>
                  <div style={s.clientName}>{client.full_name}</div>
                  {client.is_company && <span style={s.companyChip}>Company</span>}
                </div>
                <div style={s.mono}>{matterLabel[client.matter_type] ?? client.matter_type}</div>
                <div><span className={`badge ${statusClass}`}>{statusLabel}</span></div>
                <div><span className={`risk-chip r-${client.risk_level}`}>{client.risk_level}</span></div>
                <div style={s.mono}>{client.cdd_expires_at ? new Date(client.cdd_expires_at).toLocaleDateString('en-IE') : '—'}</div>
                <div style={s.mono}>{new Date(client.created_at).toLocaleDateString('en-IE')}</div>
              </Link>
            )
          })}
          {all.length === 0 && (
            <div style={s.empty}>
              No clients yet. <Link href="/dashboard/clients/new" style={{ color: 'var(--gold)' }}>Add your first client →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  topbar: { height: 56, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 },
  pageTitle: { fontFamily: 'var(--font-playfair), serif', fontSize: 16, fontWeight: 600 },
  content: { padding: '28px 30px', flex: 1 },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '9px 20px', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', cursor: 'pointer', textDecoration: 'none', color: 'inherit', transition: 'background 0.1s' },
  clientName: { fontSize: 13, fontWeight: 500 },
  mono: { fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11.5, color: 'var(--text-secondary)' },
  companyChip: { fontSize: 10, color: 'var(--blue)', background: 'rgba(74,124,184,0.1)', padding: '1px 6px', borderRadius: 3, marginLeft: 6 },
  empty: { padding: '40px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' },
}

function IconPlus() { return <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0v12M0 6h12"/></svg> }
