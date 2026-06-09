import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appApi, appQueryKeys } from './api'

export function useApps() {
  return useQuery({
    queryKey: appQueryKeys.list(),
    queryFn: appApi.list,
  })
}

export function useRegenerateSdkKey(appId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => appApi.regenerateSdkKey(appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: appQueryKeys.all() }),
  })
}
