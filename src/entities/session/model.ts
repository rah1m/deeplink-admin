import { create } from 'zustand'
import { tokenStorage, type StoredUser } from '@shared/lib'

interface SessionState {
  user: StoredUser | null
  setUser: (u: StoredUser | null) => void
  signIn: (access: string, refresh: string, user: StoredUser) => void
  signOut: () => void
  isSuperAdmin: () => boolean
  hasAppAccess: (appId: number | null | undefined) => boolean
}

export const useSession = create<SessionState>((set, get) => ({
  user: tokenStorage.getUser(),
  setUser: (u) => set({ user: u }),
  signIn: (access, refresh, user) => {
    tokenStorage.set(access, refresh, user)
    set({ user })
  },
  signOut: () => {
    tokenStorage.clear()
    set({ user: null })
  },
  isSuperAdmin: () => get().user?.role === 'super_admin',
  hasAppAccess: (appId) => {
    const u = get().user
    if (!u) return false
    if (u.role === 'super_admin') return true
    if (appId == null) return true
    return u.app_ids.includes(appId)
  },
}))
