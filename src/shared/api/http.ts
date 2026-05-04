import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@shared/config'
import { tokenStorage } from '@shared/lib/token-storage'

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _skipAuth?: boolean
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

http.interceptors.request.use((config) => {
  const cfg = config as RetriableConfig
  if (cfg._skipAuth) return cfg
  const token = tokenStorage.getAccess()
  if (token) {
    cfg.headers.set('Authorization', `Bearer ${token}`)
  }
  return cfg
})

let refreshPromise: Promise<string> | null = null

async function refreshTokens(): Promise<string> {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) throw new Error('no refresh token')
  const res = await axios.post<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>(
    `${env.apiBaseUrl}/v1/auth/refresh`,
    { refresh_token: refresh },
    { headers: { 'Content-Type': 'application/json' } },
  )
  tokenStorage.setTokens(res.data.access_token, res.data.refresh_token)
  return res.data.access_token
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original._skipAuth &&
      tokenStorage.getRefresh() &&
      !original.url?.includes('/v1/auth/')
    ) {
      original._retry = true
      try {
        refreshPromise ??= refreshTokens().finally(() => {
          refreshPromise = null
        })
        const newToken = await refreshPromise
        original.headers.set('Authorization', `Bearer ${newToken}`)
        return http.request(original)
      } catch {
        tokenStorage.clear()
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export type { AxiosRequestConfig }
