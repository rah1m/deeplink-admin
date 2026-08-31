import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@entities/session'
import { appApi, appQueryKeys } from './api'

export function useApps() {
  return useQuery({
    queryKey: appQueryKeys.list(),
    queryFn: appApi.list,
  })
}

/**
 * Apps the current user may actually work with. GET /v1/admin/apps is not
 * scoped server-side, but every scoped endpoint (links, analytics, events —
 * SRE-0035) rejects apps outside the JWT's app_ids claim, so filter dropdowns
 * must offer only these. Super admins see everything.
 */
export function useAllowedApps() {
  const apps = useApps()
  const user = useSession((s) => s.user)
  const data = useMemo(() => {
    if (!apps.data) return apps.data
    if (!user) return []
    if (user.role === 'super_admin') return apps.data
    return apps.data.filter((a) => user.app_ids.includes(a.id))
  }, [apps.data, user])
  return { ...apps, data }
}

export function useRegenerateSdkKey(appId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => appApi.regenerateSdkKey(appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: appQueryKeys.all() }),
  })
}
