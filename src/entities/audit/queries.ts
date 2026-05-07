import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { auditApi, auditQueryKeys } from './api'
import type { ListAuditParams } from './types'

export function useAuditLog(params: ListAuditParams) {
  return useQuery({
    queryKey: auditQueryKeys.list(params),
    queryFn: () => auditApi.list(params),
    placeholderData: keepPreviousData,
  })
}
