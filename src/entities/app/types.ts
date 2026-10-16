export interface SocialMeta {
  title?: string
  description?: string
  image?: string
}

/** What a desktop browser gets from a short link: a 302 to the fallback URL,
 * or the desktop app page (QR code, icon, title, store buttons). */
export type DesktopMode = 'redirect' | 'app_page'

export interface App {
  id: number
  name: string
  domain?: string
  ios_bundle_id?: string
  ios_team_id?: string
  ios_url_scheme?: string
  android_package?: string
  android_sha256_fingerprint?: string
  android_url_scheme?: string
  app_store_url?: string
  play_store_url?: string
  social_meta?: SocialMeta
  /** Where this app's links send clicks the app can't open, when a link sets
   * no fallback of its own. Read at resolve time. Empty = no default. */
  default_fallback_url?: string
  /** Default for this app's links that set no desktop_mode of their own.
   * Always present on responses. */
  desktop_mode?: DesktopMode
  /** Publishable SDK API key (dlpk_…), admin-only. Generated at app creation. */
  sdk_api_key?: string
  created_at?: string
}

export interface CreateAppInput {
  name: string
  domain?: string
  ios_bundle_id?: string
  ios_team_id?: string
  ios_url_scheme?: string
  android_package?: string
  android_sha256_fingerprint?: string
  android_url_scheme?: string
  app_store_url?: string
  play_store_url?: string
  social_meta?: SocialMeta
  /** On update, "" removes the default and omitting leaves it unchanged. */
  default_fallback_url?: string
  /** Omitted = "redirect" on create, unchanged on update. Can't be cleared. */
  desktop_mode?: DesktopMode
}

export type UpdateAppInput = Partial<CreateAppInput>
