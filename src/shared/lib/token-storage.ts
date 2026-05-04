const ACCESS = 'dl.access_token'
const REFRESH = 'dl.refresh_token'
const USER = 'dl.user'

export interface StoredUser {
  id: number
  username: string
  role: 'super_admin' | 'user'
  app_ids: number[]
}

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS)
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH)
  },
  getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  },
  set(access: string, refresh: string, user?: StoredUser) {
    localStorage.setItem(ACCESS, access)
    localStorage.setItem(REFRESH, refresh)
    if (user) localStorage.setItem(USER, JSON.stringify(user))
  },
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access)
    localStorage.setItem(REFRESH, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
    localStorage.removeItem(USER)
  },
}
