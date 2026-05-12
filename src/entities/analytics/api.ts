import { http } from '@shared/api'
import type { AppSummary, AppSummaryParams } from './types'

export const analyticsApi = {
  summary: (params: AppSummaryParams) =>
    http
      .get<AppSummary>('/v1/analytics/summary', { params })
      .then((r) => r.data),
}

export const analyticsQueryKeys = {
  all: () => ['analytics'] as const,
  summary: (params: AppSummaryParams) => ['analytics', 'summary', params] as const,
}
