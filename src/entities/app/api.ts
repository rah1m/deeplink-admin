import { http } from '@shared/api'
import type { App, CreateAppInput, UpdateAppInput } from './types'

export const appApi = {
  list: () => http.get<App[]>('/v1/apps').then((r) => r.data),
  create: (body: CreateAppInput) => http.post<App>('/v1/apps', body).then((r) => r.data),
  update: (id: number, body: UpdateAppInput) =>
    http.patch<App>(`/v1/apps/${id}`, body).then((r) => r.data),
  // Invalidates the current dlpk_ key — apps using it stop working until rebuilt.
  regenerateSdkKey: (id: number) =>
    http
      .post<{ sdk_api_key: string }>(`/v1/admin/apps/${id}/sdk-key/regenerate`)
      .then((r) => r.data),
}

export const appQueryKeys = {
  all: () => ['apps'] as const,
  list: () => ['apps', 'list'] as const,
}
