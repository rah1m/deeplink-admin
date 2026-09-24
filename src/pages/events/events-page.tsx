import { Fragment, useId, useState, type FormEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
  type Column,
} from '@shared/ui'
import { useAllowedApps } from '@entities/app'
import { ExportCsvButton, browserTimeZone } from '@features/csv-export'
import { extractError } from '@shared/api'
import {
  useEvents,
  type AnalyticsEvent,
  type EventType,
} from '@entities/event'
import { formatDate } from '@shared/lib'
import './events.css'

const PAGE_SIZE = 50

// Mirror the backend's limits on GET /v1/events meta filters.
const META_KEY_RE = /^[A-Za-z0-9_.-]{1,64}$/
const MAX_META_FILTERS = 5
const MAX_META_VALUE_LEN = 256
const COMMON_META_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'device_type',
  'in_app_browser',
  'app_direct',
  'event_name',
  'currency',
]

// The table shows local times, so a picked day is a local day. The backend
// would read a bare YYYY-MM-DD as a UTC day, so send the local midnight.
function localMidnight(date: string, addDays = 0) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d + addDays).toISOString()
}

// Numbers aren't offered: the backend compares meta->>key as text, and a
// number's original spelling (49.90) is lost once the JSON is parsed.
function filterableMeta(key: string, value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'boolean') return false
  const text = String(value)
  return (
    META_KEY_RE.test(key) && text.length > 0 && text.length <= MAX_META_VALUE_LEN
  )
}

export function EventsPage() {
  const apps = useAllowedApps()
  const [appId, setAppId] = useState<string>('')
  const [type, setType] = useState<EventType | ''>('')
  const [linkId, setLinkId] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  // Dates are YYYY-MM-DD, so string order is date order.
  const rangeInvalid = !!fromDate && !!toDate && toDate < fromDate
  const [meta, setMeta] = useState<Record<string, string>>({})
  const [metaKey, setMetaKey] = useState('')
  const [metaValue, setMetaValue] = useState('')
  const [metaError, setMetaError] = useState<string>()
  const metaKeyList = useId()
  const [offset, setOffset] = useState(0)
  const hasMeta = Object.keys(meta).length > 0

  const filters = {
    app_id: appId ? Number(appId) : undefined,
    type: type || undefined,
    link_id: linkId ? Number(linkId) : undefined,
    from: fromDate && !rangeInvalid ? localMidnight(fromDate) : undefined,
    // Exclusive bound: the next midnight keeps the whole picked day.
    to: toDate && !rangeInvalid ? localMidnight(toDate, 1) : undefined,
    meta: hasMeta ? meta : undefined,
  }
  const events = useEvents({ limit: PAGE_SIZE, offset, ...filters })

  const addMeta = (key: string, value: string) => {
    let error: string | undefined
    if (!key) error = 'Enter a meta key'
    else if (!META_KEY_RE.test(key))
      error = 'Key: up to 64 letters, digits, _ . or -'
    else if (!value) error = 'Enter a value'
    else if (value.length > MAX_META_VALUE_LEN)
      error = `Value: at most ${MAX_META_VALUE_LEN} characters`
    else if (
      !Object.hasOwn(meta, key) &&
      Object.keys(meta).length >= MAX_META_FILTERS
    )
      error = `At most ${MAX_META_FILTERS} meta filters`
    setMetaError(error)
    if (error) return false
    setMeta({ ...meta, [key]: value })
    setOffset(0)
    return true
  }

  const removeMeta = (key: string) => {
    const next = { ...meta }
    delete next[key]
    setMeta(next)
    setOffset(0)
  }

  const onAddMeta = (e: FormEvent) => {
    e.preventDefault()
    if (addMeta(metaKey.trim(), metaValue.trim())) {
      setMetaKey('')
      setMetaValue('')
    }
  }

  const metaKeySuggestions = [
    ...new Set([
      ...COMMON_META_KEYS,
      ...(events.data?.items ?? []).flatMap((e) => Object.keys(e.meta ?? {})),
    ]),
  ]
    .filter((k) => META_KEY_RE.test(k))
    .sort()

  const columns: Column<AnalyticsEvent>[] = [
    {
      key: 'type',
      header: 'Type',
      width: '120px',
      render: (e) => (
        <Badge
          tone={
            e.type === 'install'
              ? 'success'
              : e.type === 'click'
                ? 'info'
                : e.type === 'conversion'
                  ? 'primary'
                  : e.type === 'preview'
                    ? 'warning'
                    : 'neutral'
          }
        >
          {e.type}
        </Badge>
      ),
    },
    {
      key: 'link',
      header: 'Link ID',
      width: '90px',
      render: (e) => <code>#{e.link_id}</code>,
    },
    {
      key: 'person',
      header: 'Person',
      width: '140px',
      render: (e) =>
        e.visitor_id ? (
          <code style={{ fontSize: 11 }} title={e.visitor_id}>
            {e.visitor_id.length > 12
              ? `${e.visitor_id.slice(0, 12)}…`
              : e.visitor_id}
          </code>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'visit',
      header: 'Visit',
      width: '140px',
      render: (e) =>
        e.click_id ? (
          <code style={{ fontSize: 11 }} title={e.click_id}>
            {e.click_id.length > 12 ? `${e.click_id.slice(0, 12)}…` : e.click_id}
          </code>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'order',
      header: 'Order id',
      width: '140px',
      render: (e) =>
        e.idempotency_key ? (
          <code style={{ fontSize: 11 }} title={e.idempotency_key}>
            {e.idempotency_key.length > 14
              ? `${e.idempotency_key.slice(0, 14)}…`
              : e.idempotency_key}
          </code>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'meta',
      header: 'Meta',
      render: (e) =>
        e.meta && Object.keys(e.meta).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(e.meta).map(([k, v]) => {
              const text = String(v)
              const badge = (
                <Badge tone={meta[k] === text ? 'info' : 'neutral'}>
                  {k}={text}
                </Badge>
              )
              return filterableMeta(k, v) ? (
                <button
                  key={k}
                  type="button"
                  className="evt__meta-chip"
                  title={`Filter by ${k}=${text}`}
                  onClick={() => addMeta(k, text)}
                >
                  {badge}
                </button>
              ) : (
                <Fragment key={k}>{badge}</Fragment>
              )
            })}
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'fp',
      header: 'Fingerprint',
      width: '160px',
      render: (e) =>
        e.fingerprint ? (
          <code style={{ fontSize: 11 }}>{e.fingerprint.slice(0, 12)}…</code>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'when',
      header: 'When',
      width: '170px',
      render: (e) => (
        <span style={{ color: 'var(--color-text-muted)' }}>
          {formatDate(e.occurred_at)}
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Events"
        description="Click, install, open and conversion events across all links."
        actions={
          <ExportCsvButton
            url="/v1/events"
            params={{ ...filters, tz: browserTimeZone() }}
            kind="events"
            total={events.data?.total}
            noun="events"
          />
        }
      />

      <Card padding="md" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 220 }}>
            <Select
              label="App"
              value={appId}
              onChange={(e) => {
                setAppId(e.target.value)
                setOffset(0)
              }}
            >
              <option value="">All my apps</option>
              {apps.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div style={{ width: 200 }}>
            <Select
              label="Type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as EventType | '')
                setOffset(0)
              }}
            >
              <option value="">All types</option>
              <option value="click">click</option>
              <option value="install">install</option>
              <option value="open">open</option>
              <option value="conversion">conversion</option>
              <option value="preview">preview</option>
            </Select>
          </div>
          <div style={{ width: 200 }}>
            <Input
              label="Link ID"
              type="number"
              placeholder="e.g. 1"
              value={linkId}
              onChange={(e) => {
                setLinkId(e.target.value)
                setOffset(0)
              }}
            />
          </div>
          <div style={{ width: 170 }}>
            <Input
              label="From"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => {
                setFromDate(e.target.value)
                setOffset(0)
              }}
            />
          </div>
          <div style={{ width: 170 }}>
            <Input
              label="To"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value)
                setOffset(0)
              }}
            />
          </div>
        </div>
        {rangeInvalid && (
          <span className="ui-field__error evt__note">
            To must be on or after From. The date range is not applied until
            then.
          </span>
        )}

        <form className="evt__meta" onSubmit={onAddMeta}>
          <div style={{ width: 200 }}>
            <Input
              label="Meta key"
              list={metaKeyList}
              placeholder="utm_source"
              value={metaKey}
              onChange={(e) => {
                setMetaKey(e.target.value)
                setMetaError(undefined)
              }}
            />
            <datalist id={metaKeyList}>
              {metaKeySuggestions.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>
          <div style={{ width: 220 }}>
            <Input
              label="Meta value"
              placeholder="instagram"
              maxLength={MAX_META_VALUE_LEN}
              value={metaValue}
              onChange={(e) => {
                setMetaValue(e.target.value)
                setMetaError(undefined)
              }}
            />
          </div>
          <Button type="submit" variant="secondary">
            Add filter
          </Button>
        </form>
        {metaError ? (
          <span className="ui-field__error evt__note">{metaError}</span>
        ) : (
          <span className="ui-field__hint evt__note">
            Exact, case-sensitive match on the value. Click a value in the
            table to filter by it.
          </span>
        )}
        {hasMeta && (
          <div className="evt__active">
            {Object.entries(meta).map(([k, v]) => (
              <Badge key={k} tone="info">
                {k}={v}
                <button
                  type="button"
                  className="evt__chip-remove"
                  aria-label={`Remove filter ${k}`}
                  onClick={() => removeMeta(k)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {events.isError ? (
        <Card padding="md">
          <EmptyState
            title="Couldn't load events"
            description={extractError(events.error)}
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={events.data?.items}
          rowKey={(e) => `${e.link_id}-${e.occurred_at}-${e.type}`}
          loading={events.isLoading}
          empty={
            hasMeta
              ? 'No events match. Meta values must match exactly, including case.'
              : 'No events match this filter'
          }
        />
      )}

      {events.data && events.data.total > 0 && (
        <Pagination
          total={events.data.total}
          limit={events.data.limit}
          offset={events.data.offset}
          onChange={setOffset}
        />
      )}
    </>
  )
}
