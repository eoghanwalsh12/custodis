export const dynamic = 'force-dynamic'

export default function DocumentsPage() {
  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Documents</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>AML policies, procedures, and client documentation.</p>
      </div>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Coming soon</div>
      </div>
    </div>
  )
}
