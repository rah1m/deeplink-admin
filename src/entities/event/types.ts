export type EventType = 'click' | 'install' | 'open' | 'conversion' | 'preview'

export interface AnalyticsEvent {
  type: EventType
  link_id: number
  /** The visit this event belongs to — minted by the server when the link
   * resolved. NULL on rows written before click tracking was deployed. */
  click_id?: string
  /** The client's own order / transaction id, used for deduplication.
   * (Previously misnamed `click_id`.) */
  idempotency_key?: string
  /** The browser that clicked — from a 90-day first-party cookie, so one
   * person clicking five times shares a value. Absent when the browser
   * refused the cookie or the row predates visitor tracking. */
  visitor_id?: string
  fingerprint?: string
  /** Free-form key→value; values may be string, number, or boolean
   * (e.g. app_direct: true, revenue: 49.9) — never assume string. */
  meta?: Record<string, string | number | boolean>
  occurred_at: string
}

export interface ListEventsParams {
  /** Regular admins may only pass their own apps (403 otherwise). Combined
   * with link_id it intersects rather than overrides. */
  app_id?: number
  link_id?: number
  type?: EventType
  /** RFC3339 instants, half-open [from, to). The backend reads a bare
   * YYYY-MM-DD as a UTC day. */
  from?: string
  to?: string
  /** Sent as meta[key]=value; every key must match. Exact and case-sensitive,
   * compared as text (so "true" finds a boolean). At most 5 keys. */
  meta?: Record<string, string>
  limit?: number
  offset?: number
}

export interface ListEventsResponse {
  items: AnalyticsEvent[]
  total: number
  limit: number
  offset: number
}
