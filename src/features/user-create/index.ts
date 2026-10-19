export { CreateUserForm } from './ui'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, userQueryKeys, type CreateUserInput } from '@entities/user'

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserInput) => userApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userQueryKeys.all() }),
  })
}
