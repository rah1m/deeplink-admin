import { http } from '@shared/api'
import type { StoredUser } from '@shared/lib'

export interface LoginInput {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: StoredUser
}

export interface SetupInput {
  username: string
  password: string
}

export interface SetupResponse {
  id: number
  username: string
  role: 'super_admin'
  created_at: string
}

const skipAuthConfig = { _skipAuth: true } as never

export const authApi = {
  setup: (body: SetupInput): Promise<SetupResponse> =>
    http.post<SetupResponse>('/v1/auth/setup', body, skipAuthConfig).then((r) => r.data),
  login: (body: LoginInput): Promise<LoginResponse> =>
    http.post<LoginResponse>('/v1/auth/login', body, skipAuthConfig).then((r) => r.data),
  logout: (refreshToken: string) =>
    http.post<void>('/v1/auth/logout', { refresh_token: refreshToken }),
}
