import type { App, SocialMeta } from "@entities/app";

export type UtmParams = Partial<
  Record<
    "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content",
    string
  >
>;

export interface LinkStats {
  clicks: number;
  installs: number;
  opens: number;
  conversions: number;
}

export interface LinkAuthor {
  id: number;
  username: string;
}

export type LinkSource = "admin" | "service";

export type LinkSourceFilter = LinkSource | "all";

export interface LinkServiceTokenRef {
  id: number;
  name: string;
}

export interface DynamicLink {
  id: number;
  short_code: string;
  name?: string | null;
  app_id?: number | null;
  deep_link: string;
  fallback_url?: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  source?: LinkSource;
  created_by?: LinkAuthor;
  created_by_service_token?: LinkServiceTokenRef;
  social_meta?: SocialMeta;
  utm_params?: UtmParams;
  payload?: Record<string, unknown>;
  stats?: LinkStats;
  app?: App;
}

export interface ListLinksResponse {
  items: DynamicLink[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListLinksParams {
  app_id?: number;
  q?: string;
  source?: LinkSourceFilter;
  limit?: number;
  offset?: number;
}

export interface CreateLinkInput {
  short_code?: string;
  app_id?: number;
  name?: string;
  deep_link: string;
  fallback_url: string;
  expires_at?: string | null;
  social_meta?: SocialMeta;
  utm_params?: UtmParams;
  payload?: Record<string, unknown>;
}

export interface UpdateLinkInput {
  name?: string;
  deep_link?: string;
  fallback_url?: string;
  expires_at?: string | null;
  is_active?: boolean;
  social_meta?: SocialMeta;
  utm_params?: UtmParams;
  payload?: Record<string, unknown>;
}

export interface CreateLinkResponse {
  short_code: string;
  short_url: string;
}

export type CloneLinkInput = Partial<CreateLinkInput>;

export type GroupBy =
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content";

export type EventTypeKey = "click" | "install" | "open" | "conversion";

export type EventTypeCounts = Partial<Record<EventTypeKey, number>>;

export interface LinkStatsResponse {
  short_code: string;
  link_id: number;
  deep_link: string;
  clicks: number;
  installs: number;
  opens: number;
  conversions: number;
  by_type: EventTypeCounts;
  by_utm?: Record<string, EventTypeCounts>;
}

export interface PublicLinkInfo {
  short_code: string;
  deep_link: string;
  utm_params?: UtmParams;
  payload?: Record<string, unknown>;
  dynamic_params?: Record<string, string>;
  app?: {
    id: number;
    name: string;
    ios_bundle_id?: string;
    android_package?: string;
  };
}

export type TimeseriesBucketSize = "hour" | "day" | "week";

export interface TimeseriesBucket {
  ts: string;
  clicks: number;
  installs: number;
  opens: number;
  conversions: number;
  revenue: number;
}

export interface TimeseriesResponse {
  bucket: TimeseriesBucketSize;
  days: number;
  from: string;
  to: string;
  timezone: string;
  series: TimeseriesBucket[];
}

export interface TimeseriesParams {
  bucket?: TimeseriesBucketSize;
  days?: number;
  tz?: string;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  conversions: number;
  aov: number;
}

export interface RevenueBreakdown {
  currency: string;
  total_revenue: number;
  conversion_count: number;
  avg_order_value: number;
  by_source: RevenueBySource[];
}

export interface RevenueParams {
  currency?: string;
  days?: number;
}

export interface FunnelParams {
  currency?: string;
  days?: number;
}

export interface FunnelResponse {
  currency: string;
  /** Distinct visits per stage — not raw event counts like /stats. */
  clicks: number;
  installs: number;
  opens: number;
  conversions: number;
  /** Visits that opened the app directly (no browser click row) — reported
   * alongside the funnel, never inside it. `revenue + app_direct_revenue`
   * reconciles with the /revenue endpoint's total. */
  app_direct_opens: number;
  app_direct_conversions: number;
  app_direct_revenue: number;
  /** Fractions (0..1), not percentages — multiply by 100 before rendering. */
  install_rate: number;
  open_rate: number;
  conversion_rate: number;
  revenue: number;
  revenue_per_click: number;
  /** Absent (not 0) when nothing converted — render "—", never "0 seconds". */
  median_seconds_to_conversion?: number;
}
