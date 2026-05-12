import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CenteredSpinner,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
  Stat,
} from '@shared/ui'
import { useApps } from '@entities/app'
import { useAppSummary } from '@entities/analytics'
import { useLinks, useLinkTimeseries, type TimeseriesBucketSize } from '@entities/link'
import { formatNumber } from '@shared/lib'
import { BarBreakdown, TimeseriesChart } from './charts'
import './analytics.css'

const DAYS_PRESETS = [7, 14, 30, 90] as const
const BUCKETS: TimeseriesBucketSize[] = ['hour', 'day', 'week']

function deltaClass(d?: string | null) {
  if (!d) return 'an__delta an__delta--flat'
  if (d.startsWith('-')) return 'an__delta an__delta--down'
  if (d === '0%' || d === '0.0%') return 'an__delta an__delta--flat'
  return 'an__delta an__delta--up'
}

function formatRevenue(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${formatNumber(Math.round(value))} ${currency}`
  }
}

export function AnalyticsPage() {
  const apps = useApps()
  const [appId, setAppId] = useState<number | null>(null)
  const [days, setDays] = useState<number>(30)
  const [currency, setCurrency] = useState('AZN')
  const [bucket, setBucket] = useState<TimeseriesBucketSize>('day')
  const [linkShortCode, setLinkShortCode] = useState<string>('')

  useEffect(() => {
    if (appId == null && apps.data && apps.data.length > 0) {
      setAppId(apps.data[0].id)
    }
  }, [apps.data, appId])

  const summary = useAppSummary(
    appId ? { app_id: appId, days, currency } : null,
  )

  const topLinks = useLinks({
    app_id: appId ?? undefined,
    limit: 50,
    offset: 0,
  })

  const sortedLinks = useMemo(() => {
    if (!topLinks.data) return []
    return [...topLinks.data.items]
      .sort((a, b) => (b.stats?.clicks ?? 0) - (a.stats?.clicks ?? 0))
      .slice(0, 20)
  }, [topLinks.data])

  useEffect(() => {
    if (sortedLinks.length > 0) {
      const first = sortedLinks[0].short_code
      if (!sortedLinks.find((l) => l.short_code === linkShortCode)) {
        setLinkShortCode(first)
      }
    } else if (linkShortCode) {
      setLinkShortCode('')
    }
  }, [sortedLinks, linkShortCode])

  const timeseries = useLinkTimeseries(linkShortCode || undefined, { bucket, days })

  if (apps.isLoading) return <CenteredSpinner />

  if (!apps.data || apps.data.length === 0) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Marketing breakdowns across links, sources and devices."
        />
        <EmptyState
          title="No apps yet"
          description="Create an app first — analytics are scoped per app."
        />
      </>
    )
  }

  const totals = summary.data?.totals
  const deltas = summary.data?.deltas

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Per-app marketing breakdowns — totals, deltas, sources, devices and trends."
      />

      <Card padding="md" style={{ marginBottom: 16 }}>
        <div className="an__filters">
          <div style={{ width: 220 }}>
            <Select
              label="App"
              value={appId ?? ''}
              onChange={(e) => setAppId(Number(e.target.value) || null)}
            >
              {apps.data.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div style={{ width: 140 }}>
            <Select
              label="Window"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {DAYS_PRESETS.map((d) => (
                <option key={d} value={d}>
                  Last {d} days
                </option>
              ))}
            </Select>
          </div>
          <div style={{ width: 120 }}>
            <Input
              label="Currency"
              value={currency}
              maxLength={8}
              onChange={(e) =>
                setCurrency(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
              }
            />
          </div>
        </div>
      </Card>

      <div className="an__stats">
        <Stat
          label="Clicks"
          value={formatNumber(totals?.clicks)}
          hint={
            <span className={deltaClass(deltas?.clicks)}>
              {deltas?.clicks ?? '—'}
            </span>
          }
          tone="neutral"
        />
        <Stat
          label="Installs"
          value={formatNumber(totals?.installs)}
          hint={
            <span className={deltaClass(deltas?.installs)}>
              {deltas?.installs ?? '—'}
            </span>
          }
          tone="success"
        />
        <Stat
          label="Conversions"
          value={formatNumber(totals?.conversions)}
          hint={
            <span className={deltaClass(deltas?.conversions)}>
              {deltas?.conversions ?? '—'}
            </span>
          }
          tone="primary"
        />
        <Stat
          label={`Revenue (${summary.data?.currency ?? currency})`}
          value={
            totals
              ? formatRevenue(totals.revenue, summary.data?.currency ?? currency)
              : '—'
          }
          hint={
            <span className={deltaClass(deltas?.revenue)}>
              {deltas?.revenue ?? '—'}
            </span>
          }
          tone="warning"
        />
      </div>

      {summary.isError && (
        <Card padding="md">
          <p style={{ color: 'var(--color-danger)' }}>
            Couldn't load summary. The app may have no events in the window yet.
          </p>
        </Card>
      )}

      <div className="an__row">
        <Card title="Top sources" description="utm_source attribution" padding="none">
          {summary.isLoading ? (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          ) : (
            <BarBreakdown
              buckets={summary.data?.by_source ?? []}
              metric="clicks"
              emptyLabel="No source data in this window."
            />
          )}
        </Card>

        <Card title="Device mix" description="ios / android / web" padding="none">
          {summary.isLoading ? (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          ) : (
            <BarBreakdown
              buckets={summary.data?.by_device ?? []}
              metric="clicks"
              emptyLabel="No device data in this window."
            />
          )}
        </Card>
      </div>

      <Card
        title="Per-link timeseries"
        description="Pick a link to see its bucketed event trend with revenue overlay"
        padding="none"
        style={{ marginTop: 16 }}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              value={linkShortCode}
              onChange={(e) => setLinkShortCode(e.target.value)}
              style={{ width: 180 }}
            >
              <option value="">Select a link…</option>
              {sortedLinks.map((l) => (
                <option key={l.id} value={l.short_code}>
                  {l.name ? `${l.name} (${l.short_code})` : l.short_code}
                </option>
              ))}
            </Select>
            <Select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as TimeseriesBucketSize)}
              style={{ width: 110 }}
            >
              {BUCKETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {!linkShortCode ? (
          <div className="an__empty">Pick a link to chart its trend.</div>
        ) : timeseries.isLoading ? (
          <div style={{ padding: 24 }}>
            <Spinner />
          </div>
        ) : (
          <TimeseriesChart
            series={timeseries.data?.series ?? []}
            bucket={bucket}
            revenue
            currency={currency}
          />
        )}
      </Card>
    </>
  )
}
