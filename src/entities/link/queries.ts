import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { linkApi, linkQueryKeys } from './api'
import type { GroupBy, ListLinksParams } from './types'

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

export function useLinkStats(shortCode: string | undefined, groupBy?: GroupBy) {
  return useQuery({
    queryKey: shortCode
      ? linkQueryKeys.stats(shortCode, groupBy)
      : ['links', 'stats', 'none'],
    queryFn: () => linkApi.stats(shortCode!, groupBy),
    enabled: !!shortCode,
  })
}
