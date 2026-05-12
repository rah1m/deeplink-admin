import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { analyticsApi, analyticsQueryKeys } from './api'
import type { AppSummaryParams } from './types'

export function useAppSummary(params: AppSummaryParams | null) {
  return useQuery({
    queryKey: params
      ? analyticsQueryKeys.summary(params)
      : ['analytics', 'summary', 'none'],
    queryFn: () => analyticsApi.summary(params!),
    enabled: !!params && params.app_id > 0,
    placeholderData: keepPreviousData,
  })
}
