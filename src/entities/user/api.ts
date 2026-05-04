import { http } from '@shared/api'
import type { CreateUserInput, UpdateUserAppsInput, User } from './types'

export const userApi = {
  list: () => http.get<User[]>('/v1/admin/users').then((r) => r.data),
  create: (body: CreateUserInput) =>
    http.post<User>('/v1/admin/users', body).then((r) => r.data),
  setApps: (id: number, body: UpdateUserAppsInput) =>
    http.put<User>(`/v1/admin/users/${id}/apps`, body).then((r) => r.data),
  delete: (id: number) => http.delete<void>(`/v1/admin/users/${id}`).then((r) => r.data),
}

export const userQueryKeys = {
  all: () => ['users'] as const,
  list: () => ['users', 'list'] as const,
}
