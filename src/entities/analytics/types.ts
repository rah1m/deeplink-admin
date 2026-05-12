export interface AppTotals {
  clicks: number
  installs: number
  opens: number
  conversions: number
  revenue: number
}

export interface AppDeltas {
  clicks?: string | null
  installs?: string | null
  conversions?: string | null
  revenue?: string | null
}

export interface SummaryBucket {
  key: string
  clicks: number
  conversions: number
}

export interface AppSummary {
  app_id: number
  app_name: string
  days: number
  currency: string
  totals: AppTotals
  deltas: AppDeltas
  by_source: SummaryBucket[]
  by_device: SummaryBucket[]
}

export interface AppSummaryParams {
  app_id: number
  days?: number
  currency?: string
}
