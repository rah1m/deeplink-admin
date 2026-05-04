import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { userApi, userQueryKeys, type CreateUserInput } from '@entities/user'
import { Button, Input, Select } from '@shared/ui'

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserInput) => userApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userQueryKeys.all() }),
  })
}

interface CreateUserFormProps {
  loading?: boolean
  error?: string
  onSubmit: (input: CreateUserInput) => void
  onCancel: () => void
}

export function CreateUserForm({ loading, error, onSubmit, onCancel }: CreateUserFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'super_admin'>('user')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ username, password, role })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        label="Username *"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        label="Password *"
        required
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value as 'user' | 'super_admin')}
      >
        <option value="user">User</option>
        <option value="super_admin">Super admin</option>
      </Select>
      {error && <span style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</span>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create user
        </Button>
      </div>
    </form>
  )
}
