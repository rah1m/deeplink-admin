import { http } from '@shared/api'
import type {
  CreateServiceTokenInput,
  CreateServiceTokenResponse,
  ServiceToken,
} from './types'

export const serviceTokenApi = {
  list: (appId: number) =>
    http
      .get<ServiceToken[]>(`/v1/admin/apps/${appId}/tokens`)
      .then((r) => r.data),
  create: (appId: number, body: CreateServiceTokenInput) =>
    http
      .post<CreateServiceTokenResponse>(`/v1/admin/apps/${appId}/tokens`, body)
      .then((r) => r.data),
  revoke: (tokenId: number) =>
    http.delete<void>(`/v1/admin/tokens/${tokenId}`).then((r) => r.data),
}

export const serviceTokenQueryKeys = {
  all: () => ['service-tokens'] as const,
  byApp: (appId: number) => ['service-tokens', 'app', appId] as const,
}
