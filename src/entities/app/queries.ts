import { useQuery } from '@tanstack/react-query'
import { appApi, appQueryKeys } from './api'

export function useApps() {
  return useQuery({
    queryKey: appQueryKeys.list(),
    queryFn: appApi.list,
  })
}
