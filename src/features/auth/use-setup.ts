import { useMutation } from '@tanstack/react-query'
import { authApi, type SetupInput } from './api'

export function useSetup() {
  return useMutation({
    mutationFn: (body: SetupInput) => authApi.setup(body),
  })
}
