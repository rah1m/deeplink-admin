import { http } from '@shared/api'
import { env } from '@shared/config'
import type {
  CloneLinkInput,
  CreateLinkInput,
  CreateLinkResponse,
  DynamicLink,
  FunnelParams,
  FunnelResponse,
  GroupBy,
  LinkStatsResponse,
  ListLinksParams,
  ListLinksResponse,
  PublicLinkInfo,
  RevenueBreakdown,
  RevenueParams,
  TimeseriesParams,
  TimeseriesResponse,
  UpdateLinkInput,
} from './types'

// A link is served from its app's own domain (e.g. "link.bakcell.com") so
// Universal Link claims don't collide. Apps without one fall back to the API host.
function linkOrigin(domain?: string | null): string {
  const d = domain?.trim().replace(/\/+$/, '')
  if (!d) return env.apiBaseUrl
  return /^https?:\/\//i.test(d) ? d : `https://${d}`
}

export const linkApi = {
  list: (params: ListLinksParams = {}) =>
    http
      .get<ListLinksResponse>('/v1/admin/links', { params })
      .then((r) => r.data),
  create: (body: CreateLinkInput) =>
    http.post<CreateLinkResponse>('/v1/admin/links', body).then((r) => r.data),
  clone: (shortCode: string, body: CloneLinkInput = {}) =>
    http
      .post<CreateLinkResponse>(`/v1/admin/links/${shortCode}/clone`, body)
      .then((r) => r.data),
  getAdmin: (shortCode: string) =>
    http.get<DynamicLink>(`/v1/admin/links/${shortCode}`).then((r) => r.data),
  getPublic: (shortCode: string) =>
    http.get<PublicLinkInfo>(`/v1/links/${shortCode}`).then((r) => r.data),
  update: (shortCode: string, body: UpdateLinkInput) =>
    http
      .patch<DynamicLink>(`/v1/admin/links/${shortCode}`, body)
      .then((r) => r.data),
  remove: (shortCode: string) =>
    http.delete<void>(`/v1/admin/links/${shortCode}`).then((r) => r.data),
  stats: (shortCode: string, groupBy?: GroupBy) =>
    http
      .get<LinkStatsResponse>(`/v1/admin/links/${shortCode}/stats`, {
        params: groupBy ? { group_by: groupBy } : undefined,
      })
      .then((r) => r.data),
  timeseries: (shortCode: string, params: TimeseriesParams = {}) =>
    http
      .get<TimeseriesResponse>(`/v1/admin/links/${shortCode}/timeseries`, {
        params,
      })
      .then((r) => r.data),
  revenue: (shortCode: string, params: RevenueParams = {}) =>
    http
      .get<RevenueBreakdown>(`/v1/admin/links/${shortCode}/revenue`, { params })
      .then((r) => r.data),
  funnel: (shortCode: string, params: FunnelParams = {}) =>
    http
      .get<FunnelResponse>(`/v1/admin/links/${shortCode}/funnel`, { params })
      .then((r) => r.data),
  qrUrl: (shortCode: string, size = 256, domain?: string | null) =>
    `${linkOrigin(domain)}/v1/links/${shortCode}/qr?size=${size}`,
  shortUrl: (shortCode: string, domain?: string | null) =>
    `${linkOrigin(domain)}/${shortCode}`,
}

export const linkQueryKeys = {
  all: () => ['links'] as const,
  list: (params: ListLinksParams) => ['links', 'list', params] as const,
  detail: (shortCode: string) => ['links', 'detail', shortCode] as const,
  admin: (shortCode: string) => ['links', 'admin', shortCode] as const,
  stats: (shortCode: string, groupBy?: GroupBy) =>
    ['links', 'stats', shortCode, groupBy ?? 'all'] as const,
  timeseries: (shortCode: string, params: TimeseriesParams) =>
    ['links', 'timeseries', shortCode, params] as const,
  revenue: (shortCode: string, params: RevenueParams) =>
    ['links', 'revenue', shortCode, params] as const,
  funnel: (shortCode: string, params: FunnelParams) =>
    ['links', 'funnel', shortCode, params] as const,
}
