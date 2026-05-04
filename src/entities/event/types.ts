export type EventType = 'click' | 'install' | 'open' | 'conversion'

export interface AnalyticsEvent {
  type: EventType
  link_id: number
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
