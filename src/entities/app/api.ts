import { http } from '@shared/api'
import type { App, CreateAppInput, UpdateAppInput } from './types'

export const appApi = {
  list: () => http.get<App[]>('/v1/apps').then((r) => r.data),
  create: (body: CreateAppInput) => http.post<App>('/v1/apps', body).then((r) => r.data),
  update: (id: number, body: UpdateAppInput) =>
    http.patch<App>(`/v1/apps/${id}`, body).then((r) => r.data),
}

export const appQueryKeys = {
  all: () => ['apps'] as const,
  list: () => ['apps', 'list'] as const,
}
