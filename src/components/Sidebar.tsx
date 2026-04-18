'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  firmName: string
  userName: string
}

const navItems = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: IconGrid },
      { label: 'Inspection Readiness', href: '/dashboard/readiness', icon: IconClock },
    ],
  },
  {
    section: 'Compliance',
    items: [
      { label: 'Clients', href: '/dashboard/clients', icon: IconList, badge: true },
      { label: 'Documents', href: '/dashboard/documents', icon: IconDoc },
      { label: 'Risk Assessments', href: '/dashboard/risks', icon: IconShield },
    ],
  },
  {
    section: 'Firm',
    items: [
      { label: 'Business Risk Assessment', href: '/dashboard/bra', icon: IconHome },
      { label: 'Staff Training', href: '/dashboard/training', icon: IconPerson },
      { label: 'Audit Log', href: '/dashboard/audit', icon: IconLines },
    ],
  },
]

export default function Sidebar({ firmName, userName }: Props) {
  const pathname = usePathname()

  const initials = firmName
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <nav style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoWord}>Custodis</div>
        <div style={s.logoSub}>AML Compliance Platform</div>
      </div>

      <div style={s.nav}>
        {navItems.map(group => (
          <div key={group.section}>
            <div style={s.sectionLabel}>{group.section}</div>
            {group.items.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
                >
                  <Icon />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div style={s.footer}>
        <div style={s.firmRow}>
          <div style={s.avatar}>{initials}</div>
          <div>
            <div style={s.firmName}>{firmName}</div>
            <div style={s.firmRole}>{userName}</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 236,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    zIndex: 10,
    overflowY: 'auto',
  },
  logo: {
    padding: '26px 22px 22px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  logoWord: {
    fontFamily: 'var(--font-playfair), serif',
    fontSize: 21,
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.04em',
  },
  logoSub: {
    fontSize: 9.5,
    color: 'var(--text-muted)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    marginTop: 3,
  },
  nav: { padding: '14px 10px', flex: 1 },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '0 12px',
    marginBottom: 4,
    marginTop: 16,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '8px 12px',
    borderRadius: 5,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 400,
    transition: 'all 0.12s',
    marginBottom: 1,
    textDecoration: 'none',
  },
  navActive: {
    background: 'var(--gold-bg)',
    color: 'var(--gold)',
    border: '1px solid rgba(200,169,110,0.12)',
  },
  footer: {
    padding: '14px 10px',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  firmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  avatar: {
    width: 30,
    height: 30,
    background: 'var(--gold-bg)',
    border: '1px solid rgba(200,169,110,0.25)',
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-playfair), serif',
    fontSize: 11,
    color: 'var(--gold)',
    fontWeight: 600,
    flexShrink: 0,
  },
  firmName: { fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' },
  firmRole: { fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 },
}

function IconGrid() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.8, flexShrink: 0 }}><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
}
function IconClock() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, flexShrink: 0 }}><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5l2 2"/></svg>
}
function IconList() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, flexShrink: 0 }}><rect x="2" y="2" width="12" height="3" rx="0.5"/><rect x="2" y="7" width="12" height="3" rx="0.5"/><rect x="2" y="12" width="7" height="2" rx="0.5"/></svg>
}
function IconDoc() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, flexShrink: 0 }}><path d="M4 1.5h8l3 3V14a.5.5 0 01-.5.5h-11A.5.5 0 012 14V2a.5.5 0 01.5-.5H4z"/><path d="M11 1.5v4h4"/></svg>
}
function IconShield() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, flexShrink: 0 }}><path d="M8 1L1 5v4c0 3.3 3 6 7 6.5C15 15 15 9 15 9V5L8 1z"/></svg>
}
function IconHome() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, flexShrink: 0 }}><path d="M2 14V8l6-6 6 6v6H2z"/><rect x="6" y="9" width="4" height="5"/></svg>
}
function IconPerson() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, flexShrink: 0 }}><circle cx="8" cy="5" r="2.5"/><path d="M2 14.5c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/></svg>
}
function IconLines() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8, flexShrink: 0 }}><path d="M1.5 3h13M1.5 8h13M1.5 13h8"/></svg>
}
