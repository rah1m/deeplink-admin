import { Link, useRouterState } from '@tanstack/react-router'
import { useSession } from '@entities/session'
import { cn } from '@shared/lib'
import './sidebar.css'

interface NavItem {
  to: string
  label: string
  icon: string
  superAdminOnly?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '◉' },
  { to: '/links', label: 'Links', icon: '◇' },
  { to: '/analytics', label: 'Analytics', icon: '◔' },
  { to: '/apps', label: 'Apps', icon: '⬚' },
  { to: '/events', label: 'Events', icon: '◊' },
  { to: '/users', label: 'Users', icon: '⌘', superAdminOnly: true },
  { to: '/audit', label: 'Audit Log', icon: '✎', superAdminOnly: true },
]

export function Sidebar() {
  const isSuper = useSession((s) => s.isSuperAdmin())
  const path = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">DL</div>
        <div>
          <div className="sidebar__title">Dynamic Links</div>
          <div className="sidebar__sub">Admin Console</div>
        </div>
      </div>
      <nav className="sidebar__nav">
        {NAV.filter((n) => !n.superAdminOnly || isSuper).map((n) => {
          const active = n.to === '/' ? path === '/' : path.startsWith(n.to)
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn('sidebar__link', active && 'sidebar__link--active')}
            >
              <span className="sidebar__icon">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="sidebar__foot">v2.1 — API</div>
    </aside>
  )
}
