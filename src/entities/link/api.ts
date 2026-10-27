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
  // Every admin route for one link takes its numeric id, not the short code:
  // a code is unique per app only (SRE-0118), so it may name several links.
  clone: (id: number, body: CloneLinkInput = {}) =>
    http
      .post<CreateLinkResponse>(`/v1/admin/links/${id}/clone`, body)
      .then((r) => r.data),
  getAdmin: (id: number) =>
    http.get<DynamicLink>(`/v1/admin/links/${id}`).then((r) => r.data),
  update: (id: number, body: UpdateLinkInput) =>
    http
      .patch<DynamicLink>(`/v1/admin/links/${id}`, body)
      .then((r) => r.data),
  remove: (id: number) =>
    http.delete<void>(`/v1/admin/links/${id}`).then((r) => r.data),
  stats: (id: number, groupBy?: GroupBy, days?: number) =>
    http
      .get<LinkStatsResponse>(`/v1/admin/links/${id}/stats`, {
        params: { group_by: groupBy, days },
      })
      .then((r) => r.data),
  timeseries: (id: number, params: TimeseriesParams = {}) =>
    http
      .get<TimeseriesResponse>(`/v1/admin/links/${id}/timeseries`, {
        params,
      })
      .then((r) => r.data),
  revenue: (id: number, params: RevenueParams = {}) =>
    http
      .get<RevenueBreakdown>(`/v1/admin/links/${id}/revenue`, { params })
      .then((r) => r.data),
  funnel: (id: number, params: FunnelParams = {}) =>
    http
      .get<FunnelResponse>(`/v1/admin/links/${id}/funnel`, { params })
      .then((r) => r.data),
  // Public, so it stays on the code; app_id says whose code it is once two
  // apps share one (without it the backend answers 400).
  qrUrl: (
    shortCode: string,
    appId: number | null | undefined,
    size = 256,
    domain?: string | null,
  ) => {
    const qs = new URLSearchParams({ size: String(size) })
    if (appId != null) qs.set('app_id', String(appId))
    return `${linkOrigin(domain)}/v1/links/${encodeURIComponent(shortCode)}/qr?${qs}`
  },
  shortUrl: (shortCode: string, domain?: string | null) =>
    `${linkOrigin(domain)}/${shortCode}`,
}

export const linkQueryKeys = {
  all: () => ['links'] as const,
  list: (params: ListLinksParams) => ['links', 'list', params] as const,
  admin: (id: number) => ['links', 'admin', id] as const,
  stats: (id: number, groupBy?: GroupBy, days?: number) =>
    ['links', 'stats', id, groupBy ?? 'all', days ?? null] as const,
  timeseries: (id: number, params: TimeseriesParams) =>
    ['links', 'timeseries', id, params] as const,
  revenue: (id: number, params: RevenueParams) =>
    ['links', 'revenue', id, params] as const,
  funnel: (id: number, params: FunnelParams) =>
    ['links', 'funnel', id, params] as const,
}
