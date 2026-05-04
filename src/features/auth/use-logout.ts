import { useMutation } from '@tanstack/react-query'
import { authApi } from './api'
import { useSession } from '@entities/session'
import { tokenStorage } from '@shared/lib'

export function useLogout() {
  const signOut = useSession((s) => s.signOut)
  return useMutation({
    mutationFn: async () => {
      const refresh = tokenStorage.getRefresh()
      if (refresh) {
        try {
          await authApi.logout(refresh)
        } catch {
          // ignore — log out client-side either way
        }
      }
    },
    onSettled: () => signOut(),
  })
}
