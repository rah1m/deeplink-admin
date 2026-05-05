export interface SocialMeta {
  title?: string
  description?: string
  image?: string
}

export interface App {
  id: number
  name: string
  domain?: string
  ios_bundle_id?: string
  ios_team_id?: string
  android_package?: string
  android_sha256_fingerprint?: string
  app_store_url?: string
  play_store_url?: string
  social_meta?: SocialMeta
  created_at?: string
}

export interface CreateAppInput {
  name: string
  domain?: string
  ios_bundle_id?: string
  ios_team_id?: string
  android_package?: string
  android_sha256_fingerprint?: string
  app_store_url?: string
  play_store_url?: string
  social_meta?: SocialMeta
}

export type UpdateAppInput = Partial<CreateAppInput>
