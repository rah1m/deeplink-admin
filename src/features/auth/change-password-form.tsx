import { useState, type FormEvent } from 'react'
import { Button, Input } from '@shared/ui'

const MIN_LENGTH = 12

interface ChangePasswordFormProps {
  loading?: boolean
  error?: string
  onSubmit: (input: { current_password: string; new_password: string }) => void
  onCancel: () => void
}

export function ChangePasswordForm({ loading, error, onSubmit, onCancel }: ChangePasswordFormProps) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const tooShort = next.length > 0 && next.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && next !== confirm
  const canSubmit =
    current.length > 0 && next.length >= MIN_LENGTH && confirm === next && !loading

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ current_password: current, new_password: next })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        label="Current password *"
        type="password"
        autoComplete="current-password"
        required
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Input
        label="New password *"
        type="password"
        autoComplete="new-password"
        required
        value={next}
        onChange={(e) => setNext(e.target.value)}
        hint={`At least ${MIN_LENGTH} characters.`}
        error={tooShort ? `Minimum ${MIN_LENGTH} characters.` : undefined}
      />
      <Input
        label="Confirm new password *"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={mismatch ? 'Passwords do not match.' : undefined}
      />
      {error && <span style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</span>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading} disabled={!canSubmit}>
          Change password
        </Button>
      </div>
    </form>
  )
}
