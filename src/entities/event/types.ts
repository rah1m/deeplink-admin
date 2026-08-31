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
  meta?: Record<string, string>
  occurred_at: string
}

export interface ListEventsParams {
  /** Regular admins may only pass their own apps (403 otherwise). Combined
   * with link_id it intersects rather than overrides. */
  app_id?: number
  link_id?: number
  type?: EventType
  limit?: number
  offset?: number
}

export interface ListEventsResponse {
  items: AnalyticsEvent[]
  total: number
  limit: number
  offset: number
}
