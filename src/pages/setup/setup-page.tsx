import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button, Input } from '@shared/ui'
import { useSetup, useLogin } from '@features/auth'
import { extractError } from '@shared/api'

export function SetupPage() {
  const setup = useSetup()
  const login = useLogin()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setup.mutate(
      { username, password },
      {
        onSuccess: () => {
          login.mutate(
            { username, password },
            { onSuccess: () => navigate({ to: '/' }) },
          )
        },
      },
    )
  }

  const isLoading = setup.isPending || login.isPending
  const error = setup.isError ? extractError(setup.error) : null

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="login__logo">DL</div>
          <div>
            <div className="login__title">Initial setup</div>
            <div className="login__sub">Create the first super admin</div>
          </div>
        </div>
        <form className="login__form" onSubmit={submit}>
          <Input
            label="Admin username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Minimum 8 characters"
          />
          {error && <div className="login__error">{error}</div>}
          <Button type="submit" loading={isLoading}>
            Create super admin
          </Button>
        </form>
        <div className="login__hint">
          Already set up?{' '}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault()
              navigate({ to: '/login' })
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}
