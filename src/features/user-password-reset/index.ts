export { ResetUserPasswordForm } from './ui'

import { useMutation } from '@tanstack/react-query'
import { userApi } from '@entities/user'

export function useResetUserPassword(userId: number) {
  return useMutation({
    mutationFn: (new_password: string) =>
      userApi.resetPassword(userId, { new_password }),
  })
}
