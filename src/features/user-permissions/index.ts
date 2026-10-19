export { UserPermissionsForm } from './ui'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, userQueryKeys } from '@entities/user'

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
