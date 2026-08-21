export type EventType = 'click' | 'install' | 'open' | 'conversion'

export interface AnalyticsEvent {
  type: EventType
  link_id: number
  /** The visit this event belongs to — minted by the server when the link
   * resolved. NULL on rows written before click tracking was deployed. */
  click_id?: string
  /** The client's own order / transaction id, used for deduplication.
   * (Previously misnamed `click_id`.) */
  idempotency_key?: string
  fingerprint?: string
  meta?: Record<string, string>
  occurred_at: string
}

export interface ListEventsParams {
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
