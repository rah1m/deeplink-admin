export interface ServiceToken {
  id: number
  app_id: number
  name: string
  key_prefix: string
  created_at: string
  created_by?: number | null
  last_used_at?: string | null
  revoked_at?: string | null
}

export interface CreateServiceTokenInput {
  name: string
}

export interface CreateServiceTokenResponse {
  token: ServiceToken
  key: string
}
