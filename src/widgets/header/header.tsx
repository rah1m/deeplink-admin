import { useState } from 'react'
import { Badge, Button, Modal, useToast } from '@shared/ui'
import { useSession } from '@entities/session'
import { ChangePasswordForm, useChangePassword, useLogout } from '@features/auth'
import { extractError } from '@shared/api'
import './header.css'

export function Header() {
  const user = useSession((s) => s.user)
  const logout = useLogout()
  const changePassword = useChangePassword()
  const toast = useToast()
  const [pwOpen, setPwOpen] = useState(false)

  const closePw = () => {
    setPwOpen(false)
    changePassword.reset()
  }

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
        {user && (
          <Button variant="ghost" size="sm" onClick={() => setPwOpen(true)}>
            Change password
          </Button>
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

      <Modal open={pwOpen} onClose={closePw} title="Change password">
        <ChangePasswordForm
          loading={changePassword.isPending}
          error={changePassword.isError ? extractError(changePassword.error) : undefined}
          onCancel={closePw}
          onSubmit={(input) =>
            changePassword.mutate(input, {
              onSuccess: () => {
                toast?.success('Password changed')
                closePw()
              },
            })
          }
        />
      </Modal>
    </header>
  )
}
