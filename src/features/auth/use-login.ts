import { useMutation } from '@tanstack/react-query'
import { authApi, type LoginInput } from './api'
import { useSession } from '@entities/session'

export function useLogin() {
  const signIn = useSession((s) => s.signIn)
  return useMutation({
    mutationFn: (body: LoginInput) => authApi.login(body),
    onSuccess: (data) => {
      signIn(data.access_token, data.refresh_token, data.user)
    },
  })
}
