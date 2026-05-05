import { http } from '@shared/api'
import { env } from '@shared/config'
import type {
  CloneLinkInput,
  CreateLinkInput,
  CreateLinkResponse,
  DynamicLink,
  GroupBy,
  LinkStatsResponse,
  ListLinksParams,
  ListLinksResponse,
  PublicLinkInfo,
  UpdateLinkInput,
} from './types'

export const linkApi = {
  list: (params: ListLinksParams = {}) =>
    http
      .get<ListLinksResponse>('/v1/links', { params })
      .then((r) => r.data),
  create: (body: CreateLinkInput) =>
    http.post<CreateLinkResponse>('/v1/links', body).then((r) => r.data),
  clone: (shortCode: string, body: CloneLinkInput = {}) =>
    http
      .post<CreateLinkResponse>(`/v1/links/${shortCode}/clone`, body)
      .then((r) => r.data),
  getAdmin: (shortCode: string) =>
    http.get<DynamicLink>(`/v1/admin/links/${shortCode}`).then((r) => r.data),
  getPublic: (shortCode: string) =>
    http.get<PublicLinkInfo>(`/v1/links/${shortCode}`).then((r) => r.data),
  update: (shortCode: string, body: UpdateLinkInput) =>
    http.patch<DynamicLink>(`/v1/links/${shortCode}`, body).then((r) => r.data),
  remove: (shortCode: string) =>
    http.delete<void>(`/v1/links/${shortCode}`).then((r) => r.data),
  stats: (shortCode: string, groupBy?: GroupBy) =>
    http
      .get<LinkStatsResponse>(`/v1/links/${shortCode}/stats`, {
        params: groupBy ? { group_by: groupBy } : undefined,
      })
      .then((r) => r.data),
  qrUrl: (shortCode: string, size = 256) =>
    `${env.apiBaseUrl}/v1/links/${shortCode}/qr?size=${size}`,
  shortUrl: (shortCode: string) => `${env.apiBaseUrl}/${shortCode}`,
}

export const linkQueryKeys = {
  all: () => ['links'] as const,
  list: (params: ListLinksParams) => ['links', 'list', params] as const,
  detail: (shortCode: string) => ['links', 'detail', shortCode] as const,
  admin: (shortCode: string) => ['links', 'admin', shortCode] as const,
  stats: (shortCode: string, groupBy?: GroupBy) =>
    ['links', 'stats', shortCode, groupBy ?? 'all'] as const,
}
