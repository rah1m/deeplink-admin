import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { userApi, userQueryKeys, type User } from '@entities/user'
import { useApps, type App } from '@entities/app'
import { Button, Spinner } from '@shared/ui'
import './ui.css'

export function useUpdateUserApps(userId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (app_ids: number[]) => userApi.setApps(userId, { app_ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: userQueryKeys.all() }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userQueryKeys.all() }),
  })
}

interface UserPermissionsFormProps {
  user: User
  loading?: boolean
  onSave: (appIds: number[]) => void
  onCancel: () => void
}

export function UserPermissionsForm({
  user,
  loading,
  onSave,
  onCancel,
}: UserPermissionsFormProps) {
  const apps = useApps()
  const [selected, setSelected] = useState<Set<number>>(new Set(user.app_ids))

  useEffect(() => {
    setSelected(new Set(user.app_ids))
  }, [user])

  const toggle = (id: number) => {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (apps.isLoading) return <Spinner />

  return (
    <div className="user-perms">
      <p className="user-perms__hint">
        Select which apps <strong>{user.username}</strong> can access. Empty selection
        revokes all app permissions.
      </p>
      <ul className="user-perms__list">
        {apps.data?.map((a: App) => (
          <li key={a.id}>
            <label className="user-perms__row">
              <input
                type="checkbox"
                checked={selected.has(a.id)}
                onChange={() => toggle(a.id)}
              />
              <span className="user-perms__name">{a.name}</span>
              <span className="user-perms__sub">
                {a.ios_bundle_id ?? a.android_package ?? '—'}
              </span>
            </label>
          </li>
        ))}
        {apps.data?.length === 0 && (
          <li className="user-perms__empty">No apps yet — create one first.</li>
        )}
      </ul>
      <div className="user-perms__actions">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={() => onSave(Array.from(selected))} loading={loading}>
          Save
        </Button>
      </div>
    </div>
  )
}
