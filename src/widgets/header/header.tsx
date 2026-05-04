import { Badge, Button } from '@shared/ui'
import { useSession } from '@entities/session'
import { useLogout } from '@features/auth'
import './header.css'

export function Header() {
  const user = useSession((s) => s.user)
  const logout = useLogout()

  return (
    <header className="topbar">
      <div className="topbar__title">Console</div>
      <div className="topbar__right">
        {user && (
          <div className="topbar__user">
            <div className="topbar__avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div>
              <div className="topbar__name">{user.username}</div>
              <Badge tone={user.role === 'super_admin' ? 'primary' : 'neutral'}>
                {user.role === 'super_admin' ? 'Super admin' : 'User'}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          loading={logout.isPending}
        >
          Sign out
        </Button>
      </div>
    </header>
  )
}
