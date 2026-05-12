import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  type Column,
} from '@shared/ui'
import {
  useAuditLog,
  type AuditEntry,
  type AuditTargetType,
} from '@entities/audit'
import { useUsers } from '@entities/user'
import { formatDate } from '@shared/lib'

const PAGE_SIZE = 100

const ACTION_TONES: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'> = {
  'auth.login.success': 'success',
  'auth.login.failed': 'danger',
  'auth.setup': 'primary',
  'auth.password_changed': 'info',
  'user.created': 'success',
  'user.deleted': 'danger',
  'user.apps_set': 'info',
  'user.password_reset': 'warning',
  'app.created': 'success',
  'app.updated': 'info',
  'link.created': 'success',
  'link.updated': 'info',
  'link.deleted': 'danger',
  'link.cloned': 'primary',
}

function toneFor(action: string) {
  return ACTION_TONES[action] ?? 'neutral'
}

function toIso(local: string): string | undefined {
  if (!local) return undefined
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function AuditPage() {
  const [actorUserId, setActorUserId] = useState<string>('')
  const [action, setAction] = useState<string>('')
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('')
  const [targetId, setTargetId] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [offset, setOffset] = useState(0)
  const [inspect, setInspect] = useState<AuditEntry | null>(null)

  const users = useUsers()

  const audit = useAuditLog({
    limit: PAGE_SIZE,
    offset,
    actor_user_id: actorUserId ? Number(actorUserId) : undefined,
    action: action || undefined,
    target_type: targetType || undefined,
    target_id: targetId || undefined,
    from: toIso(from),
    to: toIso(to),
  })

  const usernameOf = (id: number | null) => {
    if (id == null) return null
    return users.data?.find((u) => u?.id === id)?.username ?? null
  }

  const resetAndSet = (fn: () => void) => {
    setOffset(0)
    fn()
  }

  const columns: Column<AuditEntry>[] = [
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
    {
      key: 'action',
      header: 'Action',
      width: '180px',
      render: (e) => <Badge tone={toneFor(e.action)}>{e.action}</Badge>,
    },
    {
      key: 'actor',
      header: 'Actor',
      width: '180px',
      render: (e) => {
        if (e.actor_username) {
          return (
            <span>
              <strong>{e.actor_username}</strong>
              {e.actor_role && (
                <span style={{ marginLeft: 6, color: 'var(--color-text-subtle)', fontSize: 11 }}>
                  {e.actor_role}
                </span>
              )}
            </span>
          )
        }
        return <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
      },
    },
    {
      key: 'target',
      header: 'Target',
      render: (e) => {
        if (!e.target_type && !e.target_id) {
          return <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        }
        return (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {e.target_type && <Badge tone="neutral">{e.target_type}</Badge>}
            {e.target_id && <code style={{ fontSize: 12 }}>{e.target_id}</code>}
          </div>
        )
      },
    },
    {
      key: 'ip',
      header: 'IP',
      width: '140px',
      render: (e) =>
        e.ip ? (
          <code style={{ fontSize: 11 }}>{e.ip}</code>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'details',
      header: '',
      align: 'right',
      width: '100px',
      render: (e) => (
        <Button size="sm" variant="ghost" onClick={() => setInspect(e)}>
          Details
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Sensitive operations recorded by the API: auth attempts, user/app/link CRUD."
      />

      <Card padding="md" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Input
            label="Action"
            placeholder="e.g. auth.login.failed"
            value={action}
            onChange={(e) => resetAndSet(() => setAction(e.target.value))}
          />
          <Select
            label="Target type"
            value={targetType}
            onChange={(e) =>
              resetAndSet(() => setTargetType(e.target.value as AuditTargetType | ''))
            }
          >
            <option value="">All targets</option>
            <option value="user">user</option>
            <option value="link">link</option>
            <option value="app">app</option>
            <option value="auth">auth</option>
          </Select>
          <Input
            label="Target ID"
            placeholder="short_code or user/app id"
            value={targetId}
            onChange={(e) => resetAndSet(() => setTargetId(e.target.value))}
          />
          <Input
            label="Actor user ID"
            type="number"
            placeholder="e.g. 1"
            value={actorUserId}
            onChange={(e) => resetAndSet(() => setActorUserId(e.target.value))}
          />
          <Input
            label="From"
            type="datetime-local"
            value={from}
            onChange={(e) => resetAndSet(() => setFrom(e.target.value))}
          />
          <Input
            label="To"
            type="datetime-local"
            value={to}
            onChange={(e) => resetAndSet(() => setTo(e.target.value))}
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={audit.data?.items}
        rowKey={(e) => e.id}
        loading={audit.isLoading}
        empty="No audit entries match this filter"
      />

      {audit.data && audit.data.total > 0 && (
        <Pagination
          total={audit.data.total}
          limit={audit.data.limit}
          offset={audit.data.offset}
          onChange={setOffset}
        />
      )}

      <Modal
        open={!!inspect}
        onClose={() => setInspect(null)}
        title={inspect ? `Audit entry #${inspect.id}` : ''}
      >
        {inspect && (
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="When" value={formatDate(inspect.occurred_at)} />
            <Field label="Action" value={inspect.action} />
            <Field
              label="Actor"
              value={
                inspect.actor_username
                  ? `${inspect.actor_username}${inspect.actor_role ? ` (${inspect.actor_role})` : ''}${
                      inspect.actor_user_id != null ? ` · #${inspect.actor_user_id}` : ' · unauthenticated'
                    }`
                  : '—'
              }
            />
            <Field
              label="Target"
              value={
                inspect.target_type || inspect.target_id
                  ? `${inspect.target_type ?? '—'} ${inspect.target_id ?? ''}`.trim()
                  : '—'
              }
            />
            {inspect.target_type === 'user' && inspect.target_id && (
              <Field
                label="Target user"
                value={usernameOf(Number(inspect.target_id)) ?? '(deleted or unknown)'}
              />
            )}
            <Field label="IP" value={inspect.ip ?? '—'} mono />
            <Field label="User-Agent" value={inspect.user_agent ?? '—'} mono small />
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginBottom: 4 }}>
                Metadata
              </div>
              <pre
                style={{
                  background: 'var(--color-bg-subtle, #f7f7f7)',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: 12,
                  overflowX: 'auto',
                  margin: 0,
                }}
              >
                {inspect.metadata ? JSON.stringify(inspect.metadata, null, 2) : '—'}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function Field({
  label,
  value,
  mono,
  small,
}: {
  label: string
  value: string
  mono?: boolean
  small?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontFamily: mono ? 'monospace' : undefined,
          fontSize: small ? 12 : 14,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </div>
    </div>
  )
}
