import { useMemo } from 'react'
import type { SummaryBucket } from '@entities/analytics'
import type { TimeseriesBucket } from '@entities/link'
import { formatNumber } from '@shared/lib'

const SERIES: { key: keyof Omit<TimeseriesBucket, 'ts' | 'revenue'>; label: string; color: string }[] = [
  { key: 'clicks', label: 'Clicks', color: 'var(--color-info)' },
  { key: 'installs', label: 'Installs', color: 'var(--color-success)' },
  { key: 'conversions', label: 'Conversions', color: 'var(--color-primary)' },
  { key: 'opens', label: 'Opens', color: 'var(--color-warning)' },
]

function bucketLabel(ts: string, bucket: 'hour' | 'day' | 'week') {
  const d = new Date(ts)
  if (bucket === 'hour') {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface SeriesLineProps {
  series: TimeseriesBucket[]
  bucket: 'hour' | 'day' | 'week'
  revenue?: boolean
  currency?: string
}

export function TimeseriesChart({ series, bucket, revenue, currency }: SeriesLineProps) {
  const W = 720
  const H = 220
  const padL = 40
  const padR = revenue ? 50 : 16
  const padT = 12
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const { paths, maxLeft, maxRight } = useMemo(() => {
    if (series.length === 0) {
      return { paths: [], maxLeft: 1, maxRight: 1 }
    }
    let maxLeft = 0
    let maxRight = 0
    for (const b of series) {
      for (const s of SERIES) maxLeft = Math.max(maxLeft, b[s.key])
      if (revenue) maxRight = Math.max(maxRight, b.revenue)
    }
    maxLeft = Math.max(maxLeft, 1)
    maxRight = Math.max(maxRight, 1)
    const stepX = series.length > 1 ? innerW / (series.length - 1) : 0
    const paths = SERIES.map((s) => {
      const points = series.map((b, i) => {
        const x = padL + i * stepX
        const y = padT + innerH - (b[s.key] / maxLeft) * innerH
        return { x, y, v: b[s.key] }
      })
      const d =
        points.length === 0
          ? ''
          : `M${points[0].x},${points[0].y} ` +
            points.slice(1).map((p) => `L${p.x},${p.y}`).join(' ')
      return { key: s.key, label: s.label, color: s.color, d }
    })
    return { paths, maxLeft, maxRight }
  }, [series, innerW, innerH, padL, padT, revenue])

  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0
  const revenuePath = useMemo(() => {
    if (!revenue || series.length === 0) return ''
    return (
      `M${padL},${padT + innerH - (series[0].revenue / Math.max(maxRight, 1)) * innerH} ` +
      series
        .slice(1)
        .map((b, i) => {
          const x = padL + (i + 1) * stepX
          const y = padT + innerH - (b.revenue / Math.max(maxRight, 1)) * innerH
          return `L${x},${y}`
        })
        .join(' ')
    )
  }, [series, revenue, maxRight, innerH, padL, padT, stepX])

  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((maxLeft / ticks) * i),
  )

  if (series.length === 0) {
    return <div className="an__empty">No data for this window.</div>
  }

  return (
    <div className="an__chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Timeseries">
        {yTicks.map((v, i) => {
          const y = padT + innerH - (v / Math.max(maxLeft, 1)) * innerH
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeDasharray={i === 0 ? undefined : '2 3'}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--color-text-subtle)"
              >
                {formatNumber(v)}
              </text>
            </g>
          )
        })}

        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        ))}

        {revenue && revenuePath && (
          <path
            d={revenuePath}
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth={1.6}
            strokeDasharray="3 3"
            strokeLinejoin="round"
          />
        )}

        {series.map((b, i) => {
          const skip = series.length > 8 && i % Math.ceil(series.length / 8) !== 0
          if (skip && i !== series.length - 1) return null
          const x = padL + i * stepX
          return (
            <text
              key={i}
              x={x}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-subtle)"
            >
              {bucketLabel(b.ts, bucket)}
            </text>
          )
        })}
      </svg>

      <div className="an__legend">
        {SERIES.map((s) => (
          <span key={s.key} className="an__legend-item">
            <span className="an__legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        {revenue && (
          <span className="an__legend-item">
            <span
              className="an__legend-dot"
              style={{ background: 'var(--color-danger)' }}
            />
            Revenue{currency ? ` (${currency})` : ''}
          </span>
        )}
      </div>
    </div>
  )
}

interface BarBreakdownProps {
  buckets: SummaryBucket[]
  metric?: 'clicks' | 'conversions'
  emptyLabel?: string
}

export function BarBreakdown({ buckets, metric = 'clicks', emptyLabel }: BarBreakdownProps) {
  const sorted = useMemo(() => {
    const items = [...buckets]
      .map((b) => ({ key: b.key || '(none)', clicks: b.clicks, conversions: b.conversions }))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 10)
    const max = Math.max(1, ...items.map((i) => i[metric]))
    return { items, max }
  }, [buckets, metric])

  if (sorted.items.length === 0) {
    return <div className="an__empty">{emptyLabel ?? 'No data'}</div>
  }

  return (
    <ul className="an__bars">
      {sorted.items.map((row) => {
        const pct = (row[metric] / sorted.max) * 100
        const rate = row.clicks > 0 ? Math.round((row.conversions / row.clicks) * 100) : 0
        return (
          <li key={row.key} className="an__bar-row">
            <code className="an__bar-label" title={row.key}>
              {row.key}
            </code>
            <div className="an__bar-track">
              <div
                className="an__bar-fill"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="an__bar-value">
              {formatNumber(row[metric])}
              <span className="an__bar-rate">{rate}% conv.</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
