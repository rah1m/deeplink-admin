import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { linkApi, linkQueryKeys } from './api'
import type {
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

export function useLinkPublic(shortCode: string | undefined) {
  return useQuery({
    queryKey: shortCode ? linkQueryKeys.detail(shortCode) : ['links', 'detail', 'none'],
    queryFn: () => linkApi.getPublic(shortCode!),
    enabled: !!shortCode,
  })
}

export function useLinkAdmin(shortCode: string | undefined) {
  return useQuery({
    queryKey: shortCode ? linkQueryKeys.admin(shortCode) : ['links', 'admin', 'none'],
    queryFn: () => linkApi.getAdmin(shortCode!),
    enabled: !!shortCode,
  })
}

export function useLinkStats(shortCode: string | undefined, groupBy?: GroupBy) {
  return useQuery({
    queryKey: shortCode
      ? linkQueryKeys.stats(shortCode, groupBy)
      : ['links', 'stats', 'none'],
    queryFn: () => linkApi.stats(shortCode!, groupBy),
    enabled: !!shortCode,
  })
}

export function useLinkTimeseries(
  shortCode: string | undefined,
  params: TimeseriesParams = {},
) {
  return useQuery({
    queryKey: shortCode
      ? linkQueryKeys.timeseries(shortCode, params)
      : ['links', 'timeseries', 'none'],
    queryFn: () => linkApi.timeseries(shortCode!, params),
    enabled: !!shortCode,
    placeholderData: keepPreviousData,
  })
}

export function useLinkRevenue(
  shortCode: string | undefined,
  params: RevenueParams = {},
) {
  return useQuery({
    queryKey: shortCode
      ? linkQueryKeys.revenue(shortCode, params)
      : ['links', 'revenue', 'none'],
    queryFn: () => linkApi.revenue(shortCode!, params),
    enabled: !!shortCode,
    placeholderData: keepPreviousData,
  })
}
