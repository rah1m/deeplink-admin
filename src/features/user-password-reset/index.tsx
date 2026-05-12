import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { userApi } from '@entities/user'
import { Button, Input } from '@shared/ui'

const MIN_LENGTH = 12

export function useResetUserPassword(userId: number) {
  return useMutation({
    mutationFn: (new_password: string) =>
      userApi.resetPassword(userId, { new_password }),
  })
}

interface ResetUserPasswordFormProps {
  username: string
  loading?: boolean
  error?: string
  onSubmit: (newPassword: string) => void
  onCancel: () => void
}

export function ResetUserPasswordForm({
  username,
  loading,
  error,
  onSubmit,
  onCancel,
}: ResetUserPasswordFormProps) {
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const tooShort = next.length > 0 && next.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && next !== confirm
  const canSubmit = next.length >= MIN_LENGTH && confirm === next && !loading

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(next)
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        Force a new password for <strong>{username}</strong>. The user's current password is
        not required. Existing sessions stay active until their tokens expire.
      </p>
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
          Reset password
        </Button>
      </div>
    </form>
  )
}
