import { http } from '@shared/api'
import type { ListAuditParams, ListAuditResponse } from './types'

export const auditApi = {
  list: (params: ListAuditParams = {}) =>
    http
      .get<ListAuditResponse>('/v1/admin/audit', { params })
      .then((r) => r.data),
}

export const auditQueryKeys = {
  all: () => ['audit'] as const,
  list: (params: ListAuditParams) => ['audit', 'list', params] as const,
}
