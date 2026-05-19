export type AuditTargetType =
  | 'user'
  | 'link'
  | 'app'
  | 'auth'
  | 'service_token'

export type AuditAction =
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.setup'
  | 'auth.password_changed'
  | 'user.created'
  | 'user.deleted'
  | 'user.apps_set'
  | 'user.password_reset'
  | 'app.created'
  | 'app.updated'
  | 'link.created'
  | 'link.updated'
  | 'link.deleted'
  | 'link.cloned'
  | 'service_token.created'
  | 'service_token.revoked'
  | (string & {})

export interface AuditEntry {
  id: number
  occurred_at: string
  actor_user_id: number | null
  actor_username: string | null
  actor_role: string | null
  action: AuditAction
  target_type: AuditTargetType | null
  target_id: string | null
  ip: string | null
  user_agent: string | null
  metadata?: Record<string, unknown> | null
}

export interface ListAuditParams {
  actor_user_id?: number
  action?: string
  target_type?: AuditTargetType
  target_id?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface ListAuditResponse {
  items: AuditEntry[]
  total: number
  limit: number
  offset: number
}
