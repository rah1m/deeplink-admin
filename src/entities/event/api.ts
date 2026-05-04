import { http } from '@shared/api'
import type { ListEventsParams, ListEventsResponse } from './types'

export const eventApi = {
  list: (params: ListEventsParams = {}) =>
    http
      .get<ListEventsResponse>('/v1/events', { params })
      .then((r) => r.data),
}

export const eventQueryKeys = {
  all: () => ['events'] as const,
  list: (params: ListEventsParams) => ['events', 'list', params] as const,
}
