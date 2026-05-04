import { useState } from 'react'
import {
  Badge,
  Card,
  DataTable,
  Input,
  PageHeader,
  Pagination,
  Select,
  type Column,
} from '@shared/ui'
import {
  useEvents,
  type AnalyticsEvent,
  type EventType,
} from '@entities/event'
import { formatDate } from '@shared/lib'

const PAGE_SIZE = 50

export function EventsPage() {
  const [type, setType] = useState<EventType | ''>('')
  const [linkId, setLinkId] = useState<string>('')
  const [offset, setOffset] = useState(0)

  const events = useEvents({
    limit: PAGE_SIZE,
    offset,
    type: type || undefined,
    link_id: linkId ? Number(linkId) : undefined,
  })

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
      key: 'meta',
      header: 'Meta',
      render: (e) =>
        e.meta && Object.keys(e.meta).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(e.meta).map(([k, v]) => (
              <Badge key={k} tone="neutral">
                {k}={v as string}
              </Badge>
            ))}
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
      />

      <Card padding="md" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={events.data?.items}
        rowKey={(e) => `${e.link_id}-${e.occurred_at}-${e.type}`}
        loading={events.isLoading}
        empty="No events match this filter"
      />

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
