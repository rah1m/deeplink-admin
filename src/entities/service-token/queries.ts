import { useQuery } from '@tanstack/react-query'
import { serviceTokenApi, serviceTokenQueryKeys } from './api'

export function useServiceTokens(appId: number | undefined) {
  return useQuery({
    queryKey: appId
      ? serviceTokenQueryKeys.byApp(appId)
      : ['service-tokens', 'app', 'none'],
    queryFn: () => serviceTokenApi.list(appId!),
    enabled: !!appId,
  })
}
