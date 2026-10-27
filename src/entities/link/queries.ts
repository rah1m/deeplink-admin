import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { linkApi, linkQueryKeys } from './api'
import type {
  FunnelParams,
  GroupBy,
  ListLinksParams,
  RevenueParams,
  TimeseriesParams,
} from './types'

export function useLinks(params: ListLinksParams) {
  return useQuery({
    queryKey: linkQueryKeys.list(params),
    queryFn: () => linkApi.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useLinkAdmin(id: number | undefined) {
  return useQuery({
    queryKey: id ? linkQueryKeys.admin(id) : ['links', 'admin', 'none'],
    queryFn: () => linkApi.getAdmin(id!),
    enabled: !!id,
  })
}

export function useLinkStats(
  id: number | undefined,
  groupBy?: GroupBy,
  days?: number,
) {
  return useQuery({
    queryKey: id
      ? linkQueryKeys.stats(id, groupBy, days)
      : ['links', 'stats', 'none'],
    queryFn: () => linkApi.stats(id!, groupBy, days),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useLinkTimeseries(
  id: number | undefined,
  params: TimeseriesParams = {},
) {
  return useQuery({
    queryKey: id
      ? linkQueryKeys.timeseries(id, params)
      : ['links', 'timeseries', 'none'],
    queryFn: () => linkApi.timeseries(id!, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useLinkRevenue(
  id: number | undefined,
  params: RevenueParams = {},
) {
  return useQuery({
    queryKey: id
      ? linkQueryKeys.revenue(id, params)
      : ['links', 'revenue', 'none'],
    queryFn: () => linkApi.revenue(id!, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useLinkFunnel(
  id: number | undefined,
  params: FunnelParams = {},
) {
  return useQuery({
    queryKey: id
      ? linkQueryKeys.funnel(id, params)
      : ['links', 'funnel', 'none'],
    queryFn: () => linkApi.funnel(id!, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}
