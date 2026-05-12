import { useMutation } from '@tanstack/react-query'
import { authApi, type ChangePasswordInput } from './api'

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordInput) => authApi.changePassword(body),
  })
}
