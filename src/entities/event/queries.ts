import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { eventApi, eventQueryKeys } from './api'
import type { ListEventsParams } from './types'

export function useEvents(params: ListEventsParams) {
  return useQuery({
    queryKey: eventQueryKeys.list(params),
    queryFn: () => eventApi.list(params),
    placeholderData: keepPreviousData,
  })
}
