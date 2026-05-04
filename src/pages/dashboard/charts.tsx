import { useMemo } from 'react'
import type { AnalyticsEvent, EventType } from '@entities/event'
import type { DynamicLink } from '@entities/link'
import { formatNumber } from '@shared/lib'

const SERIES: { type: EventType; label: string; color: string }[] = [
  { type: 'click', label: 'Clicks', color: 'var(--color-info)' },
  { type: 'install', label: 'Installs', color: 'var(--color-success)' },
  { type: 'conversion', label: 'Conversions', color: 'var(--color-primary)' },
  { type: 'open', label: 'Opens', color: 'var(--color-warning)' },
]

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function dayLabel(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

interface EventsTimelineProps {
  events: AnalyticsEvent[]
  days?: number
}

export function EventsTimeline({ events, days = 14 }: EventsTimelineProps) {
  const { buckets, max, types } = useMemo(() => {
    const today = startOfDay(new Date())
    const dayMs = 86_400_000
    const buckets = Array.from({ length: days }, (_, i) => {
      const ts = today - (days - 1 - i) * dayMs
      const counts: Record<EventType, number> = {
        click: 0,
        install: 0,
        open: 0,
        conversion: 0,
      }
      return { ts, counts }
    })
    const first = buckets[0].ts
    for (const e of events) {
      const t = startOfDay(new Date(e.occurred_at))
      if (t < first) continue
      const idx = Math.round((t - first) / dayMs)
      if (idx < 0 || idx >= buckets.length) continue
      buckets[idx].counts[e.type] += 1
    }
    const types: EventType[] = ['click', 'install', 'conversion', 'open']
    let max = 0
    for (const b of buckets) {
      const total = types.reduce((s, t) => s + b.counts[t], 0)
      if (total > max) max = total
    }
    return { buckets, max: Math.max(max, 1), types }
  }, [events, days])

  const W = 560
  const H = 180
  const padL = 32
  const padR = 12
  const padT = 12
  const padB = 24
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const stepX = buckets.length > 1 ? innerW / (buckets.length - 1) : 0

  const seriesPaths = useMemo(() => {
    const stacks = buckets.map(() => 0)
    return types.map((t) => {
      const top = buckets.map((b, i) => {
        stacks[i] += b.counts[t]
        const x = padL + i * stepX
        const y = padT + innerH - (stacks[i] / max) * innerH
        return { x, y, total: stacks[i] }
      })
      const bottom = top.map((p, i) => {
        const prev = stacks[i] - buckets[i].counts[t]
        const y = padT + innerH - (prev / max) * innerH
        return { x: p.x, y }
      })
      const area =
        `M${top[0].x},${top[0].y} ` +
        top.slice(1).map((p) => `L${p.x},${p.y}`).join(' ') +
        ' ' +
        bottom
          .slice()
          .reverse()
          .map((p) => `L${p.x},${p.y}`)
          .join(' ') +
        ' Z'
      const line = `M${top[0].x},${top[0].y} ` + top.slice(1).map((p) => `L${p.x},${p.y}`).join(' ')
      const meta = SERIES.find((s) => s.type === t)!
      return { type: t, area, line, color: meta.color, label: meta.label }
    })
  }, [buckets, types, max, innerH, innerW, stepX])

  const ticks = 4
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((max / ticks) * i),
  )

  return (
    <div className="dash__chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="dash__chart-svg" role="img" aria-label="Events over time">
        {tickValues.map((v, i) => {
          const y = padT + innerH - (v / max) * innerH
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
                fontSize="9"
                fill="var(--color-text-subtle)"
              >
                {formatNumber(v)}
              </text>
            </g>
          )
        })}

        {seriesPaths.map((s) => (
          <path key={`a-${s.type}`} d={s.area} fill={s.color} fillOpacity={0.18} />
        ))}
        {seriesPaths.map((s) => (
          <path
            key={`l-${s.type}`}
            d={s.line}
            fill="none"
            stroke={s.color}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ))}

        {buckets.map((b, i) => {
          if (buckets.length > 7 && i % 2 !== 0 && i !== buckets.length - 1) return null
          const x = padL + i * stepX
          return (
            <text
              key={i}
              x={x}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-text-subtle)"
            >
              {dayLabel(b.ts)}
            </text>
          )
        })}
      </svg>

      <div className="dash__legend">
        {SERIES.map((s) => (
          <span key={s.type} className="dash__legend-item">
            <span className="dash__legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

interface EventTypeDonutProps {
  events: AnalyticsEvent[]
}

export function EventTypeDonut({ events }: EventTypeDonutProps) {
  const data = useMemo(() => {
    const counts: Record<EventType, number> = {
      click: 0,
      install: 0,
      open: 0,
      conversion: 0,
    }
    for (const e of events) counts[e.type] += 1
    const total = (Object.values(counts) as number[]).reduce((s, v) => s + v, 0)
    return { counts, total }
  }, [events])

  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 62
  const stroke = 22
  const circumference = 2 * Math.PI * r

  let offset = 0
  const segments = SERIES.map((s) => {
    const value = data.counts[s.type]
    const fraction = data.total === 0 ? 0 : value / data.total
    const length = fraction * circumference
    const seg = {
      type: s.type,
      label: s.label,
      color: s.color,
      value,
      fraction,
      dasharray: `${length} ${circumference - length}`,
      dashoffset: -offset,
    }
    offset += length
    return seg
  })

  return (
    <div className="dash__donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Event type breakdown">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        {data.total > 0 &&
          segments.map((s) => (
            <circle
              key={s.type}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="20" fontWeight={600} fill="var(--color-text)">
          {formatNumber(data.total)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill="var(--color-text-subtle)">
          events
        </text>
      </svg>

      <ul className="dash__donut-legend">
        {segments.map((s) => (
          <li key={s.type}>
            <span className="dash__legend-dot" style={{ background: s.color }} />
            <span className="dash__donut-label">{s.label}</span>
            <span className="dash__donut-value">
              {formatNumber(s.value)}
              <span className="dash__donut-pct">
                {data.total === 0 ? '0%' : `${Math.round(s.fraction * 100)}%`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface TopLinksBarProps {
  links: DynamicLink[]
  limit?: number
}

export function TopLinksBar({ links, limit = 6 }: TopLinksBarProps) {
  const rows = useMemo(() => {
    const sorted = [...links]
      .map((l) => ({
        id: l.id,
        short_code: l.short_code,
        clicks: l.stats?.clicks ?? 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit)
    const max = Math.max(1, ...sorted.map((r) => r.clicks))
    return { items: sorted, max }
  }, [links, limit])

  if (rows.items.length === 0) {
    return <div className="dash__bar-empty">No link data yet</div>
  }

  return (
    <ul className="dash__bars">
      {rows.items.map((r) => {
        const pct = (r.clicks / rows.max) * 100
        return (
          <li key={r.id} className="dash__bar-row">
            <code className="dash__bar-label">{r.short_code}</code>
            <div className="dash__bar-track">
              <div className="dash__bar-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
            <span className="dash__bar-value">{formatNumber(r.clicks)}</span>
          </li>
        )
      })}
    </ul>
  )
}
