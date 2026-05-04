import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button, Input } from '@shared/ui'
import { useLogin } from '@features/auth'
import { extractError } from '@shared/api'
import './login-page.css'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate(
      { username, password },
      {
        onSuccess: () => navigate({ to: '/' }),
      },
    )
  }

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="login__logo">DL</div>
          <div>
            <div className="login__title">Dynamic Links</div>
            <div className="login__sub">Admin Console</div>
          </div>
        </div>
        <form className="login__form" onSubmit={submit}>
          <Input
            label="Username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {login.isError && (
            <div className="login__error">
              {extractError(login.error, 'Login failed')}
            </div>
          )}
          <Button type="submit" loading={login.isPending}>
            Sign in
          </Button>
        </form>
        <div className="login__hint">
          First time?{' '}
          <a href="/setup" onClick={(e) => { e.preventDefault(); navigate({ to: '/setup' }) }}>
            Run setup
          </a>
        </div>
      </div>
    </div>
  )
}
