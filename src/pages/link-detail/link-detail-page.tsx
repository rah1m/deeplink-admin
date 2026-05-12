import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  CenteredSpinner,
  ConfirmDialog,
  Input,
  Modal,
  PageHeader,
  Select,
  Stat,
  useToast,
} from '@shared/ui'
import { LinkForm } from '@features/link-create'
import { useDeleteLink, useUpdateLink } from '@features/link-edit'
import { useCloneLink } from '@features/link-clone'
import {
  linkApi,
  useLinkAdmin,
  useLinkRevenue,
  useLinkStats,
  useLinkTimeseries,
  type GroupBy,
  type TimeseriesBucketSize,
} from '@entities/link'
import { copyToClipboard, formatDate, formatNumber } from '@shared/lib'
import { extractError } from '@shared/api'
import { TimeseriesChart } from '@pages/analytics/charts'
import './link-detail.css'

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

export function LinkDetailPage() {
  const { shortCode } = useParams({ strict: false }) as { shortCode: string }
  const navigate = useNavigate()
  const toast = useToast()

  const link = useLinkAdmin(shortCode)
  const [groupBy, setGroupBy] = useState<GroupBy | ''>('')
  const stats = useLinkStats(shortCode, groupBy || undefined)
  const [bucket, setBucket] = useState<TimeseriesBucketSize>('day')
  const [days, setDays] = useState<number>(30)
  const [currency, setCurrency] = useState<string>('AZN')
  const timeseries = useLinkTimeseries(shortCode, { bucket, days })
  const revenue = useLinkRevenue(shortCode, { currency, days: 90 })

  const update = useUpdateLink(shortCode)
  const clone = useCloneLink(shortCode)
  const remove = useDeleteLink(shortCode)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (link.isLoading) return <CenteredSpinner />
  if (link.isError || !link.data) {
    return <div>Link not found.</div>
  }

  const data = link.data
  const shortUrl = linkApi.shortUrl(shortCode)
  const qrUrl = linkApi.qrUrl(shortCode, 320)

  const expired = data.expires_at != null && new Date(data.expires_at) < new Date()

  const onCopy = async () => {
    await copyToClipboard(shortUrl)
    toast.success('Short URL copied')
  }

  const toggleActive = (next: boolean) => {
    update.mutate(
      { is_active: next },
      {
        onSuccess: () => {
          toast.success(next ? 'Link activated' : 'Link deactivated')
          link.refetch()
        },
        onError: (err) => toast.error(extractError(err)),
      },
    )
  }

  const onClone = () => {
    clone.mutate(
      {},
      {
        onSuccess: (res) => toast.success(`Cloned as ${res.short_code}`),
        onError: (err) => toast.error(extractError(err)),
      },
    )
  }

  const onConfirmDelete = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('Link deleted')
        setDeleteOpen(false)
        navigate({ to: '/links' })
      },
      onError: (err) => toast.error(extractError(err)),
    })
  }

  const statusBadge = !data.is_active ? (
    <Badge tone="neutral">Inactive</Badge>
  ) : expired ? (
    <Badge tone="warning">Expired</Badge>
  ) : (
    <Badge tone="success">Live</Badge>
  )

  return (
    <>
      <PageHeader
        title={
          <span>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
              <Link to="/links">Links</Link> /{' '}
            </span>
            <code>{shortCode}</code>
          </span>
        }
        description={data.name ?? undefined}
        actions={
          <>
            <Button variant="secondary" onClick={onCopy}>
              Copy URL
            </Button>
            <Button variant="secondary" onClick={onClone} loading={clone.isPending}>
              Clone
            </Button>
            <Button onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="lkd__grid">
        <div className="lkd__col">
          <div className="lkd__stats">
            <Stat label="Clicks" value={formatNumber(stats.data?.clicks)} tone="primary" />
            <Stat
              label="Installs"
              value={formatNumber(stats.data?.installs)}
              tone="success"
            />
            <Stat label="Opens" value={formatNumber(stats.data?.opens)} tone="neutral" />
            <Stat
              label="Conversions"
              value={formatNumber(stats.data?.conversions)}
              tone="warning"
            />
          </div>

          <Card title="Details" padding="md">
            <dl className="lkd__dl">
              {data.name && (
                <>
                  <dt>Name</dt>
                  <dd>{data.name}</dd>
                </>
              )}

              <dt>Short URL</dt>
              <dd>
                <a href={shortUrl} target="_blank" rel="noreferrer">
                  {shortUrl}
                </a>
              </dd>

              <dt>Deep link</dt>
              <dd>
                <code>{data.deep_link}</code>
              </dd>

              {data.fallback_url && (
                <>
                  <dt>Fallback URL</dt>
                  <dd>
                    <a href={data.fallback_url} target="_blank" rel="noreferrer">
                      {data.fallback_url}
                    </a>
                  </dd>
                </>
              )}

              {data.app && (
                <>
                  <dt>App</dt>
                  <dd>
                    {data.app.name}{' '}
                    <span className="lkd__sub">
                      ({data.app.ios_bundle_id ?? data.app.android_package ?? '—'})
                    </span>
                  </dd>
                </>
              )}

              <dt>Created</dt>
              <dd>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {formatDate(data.created_at)}
                </span>
                {data.created_by && (
                  <>
                    {' '}
                    <span className="lkd__sub">
                      by {data.created_by.username}
                    </span>
                  </>
                )}
              </dd>

              <dt>Expires</dt>
              <dd>
                {data.expires_at ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(data.expires_at)}
                  </span>
                ) : (
                  <span className="lkd__sub">Never</span>
                )}
              </dd>

              {data.utm_params && Object.keys(data.utm_params).length > 0 && (
                <>
                  <dt>UTM</dt>
                  <dd>
                    <div className="lkd__chips">
                      {Object.entries(data.utm_params).map(([k, v]) => (
                        <Badge key={k} tone="info">
                          {k}={v}
                        </Badge>
                      ))}
                    </div>
                  </dd>
                </>
              )}

              {data.social_meta && Object.keys(data.social_meta).length > 0 && (
                <>
                  <dt>Social meta</dt>
                  <dd>
                    <pre className="lkd__pre">
                      {JSON.stringify(data.social_meta, null, 2)}
                    </pre>
                  </dd>
                </>
              )}

              {data.payload && Object.keys(data.payload).length > 0 && (
                <>
                  <dt>Payload</dt>
                  <dd>
                    <pre className="lkd__pre">
                      {JSON.stringify(data.payload, null, 2)}
                    </pre>
                  </dd>
                </>
              )}
            </dl>
          </Card>

          <Card
            title="Trend"
            description="Bucketed clicks / installs / conversions with revenue overlay."
            padding="none"
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <Select
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value as TimeseriesBucketSize)}
                  style={{ width: 110 }}
                >
                  <option value="hour">hour</option>
                  <option value="day">day</option>
                  <option value="week">week</option>
                </Select>
                <Select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={{ width: 140 }}
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </Select>
              </div>
            }
          >
            {timeseries.isLoading ? (
              <div style={{ padding: 24 }}>
                <CenteredSpinner />
              </div>
            ) : (
              <TimeseriesChart
                series={timeseries.data?.series ?? []}
                bucket={bucket}
                revenue
                currency={revenue.data?.currency ?? currency}
              />
            )}
          </Card>

          <Card
            title="Revenue"
            description={`Conversions tagged with meta.revenue · last 90 days · ${revenue.data?.currency ?? currency}`}
            padding="none"
            actions={
              <Input
                value={currency}
                maxLength={8}
                onChange={(e) =>
                  setCurrency(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
                }
                style={{ width: 90 }}
              />
            }
          >
            {revenue.isLoading ? (
              <div style={{ padding: 24 }}>
                <CenteredSpinner />
              </div>
            ) : revenue.isError ? (
              <div className="lkd__empty">Couldn't load revenue.</div>
            ) : (
              <>
                <div className="lkd__rev-grid">
                  <div className="lkd__rev-stat">
                    <div className="lkd__rev-stat-label">Total revenue</div>
                    <div className="lkd__rev-stat-value">
                      {formatRevenue(revenue.data?.total_revenue ?? 0, revenue.data?.currency ?? currency)}
                    </div>
                  </div>
                  <div className="lkd__rev-stat">
                    <div className="lkd__rev-stat-label">Conversions</div>
                    <div className="lkd__rev-stat-value">
                      {formatNumber(revenue.data?.conversion_count ?? 0)}
                    </div>
                  </div>
                  <div className="lkd__rev-stat">
                    <div className="lkd__rev-stat-label">Avg order value</div>
                    <div className="lkd__rev-stat-value">
                      {formatRevenue(revenue.data?.avg_order_value ?? 0, revenue.data?.currency ?? currency)}
                    </div>
                  </div>
                </div>
                {revenue.data?.by_source && revenue.data.by_source.length > 0 ? (
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                        <th style={{ textAlign: 'right' }}>Conversions</th>
                        <th style={{ textAlign: 'right' }}>AOV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.data.by_source.map((r) => (
                        <tr key={r.source || '(none)'}>
                          <td><code>{r.source || '(none)'}</code></td>
                          <td style={{ textAlign: 'right' }}>
                            {formatRevenue(r.revenue, revenue.data!.currency)}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(r.conversions)}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatRevenue(r.aov, revenue.data!.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="lkd__empty">No revenue events in the window.</div>
                )}
              </>
            )}
          </Card>

          <Card
            title="Stats by UTM"
            actions={
              <Select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy | '')}
                style={{ width: 180 }}
              >
                <option value="">No grouping</option>
                <option value="utm_source">utm_source</option>
                <option value="utm_medium">utm_medium</option>
                <option value="utm_campaign">utm_campaign</option>
                <option value="utm_term">utm_term</option>
                <option value="utm_content">utm_content</option>
              </Select>
            }
            padding="none"
          >
            {!groupBy ? (
              <div className="lkd__empty">Pick a UTM dimension to break down events.</div>
            ) : !stats.data?.by_utm || Object.keys(stats.data.by_utm).length === 0 ? (
              <div className="lkd__empty">No data for this dimension.</div>
            ) : (
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{groupBy}</th>
                    <th style={{ textAlign: 'right' }}>Click</th>
                    <th style={{ textAlign: 'right' }}>Install</th>
                    <th style={{ textAlign: 'right' }}>Open</th>
                    <th style={{ textAlign: 'right' }}>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.data.by_utm).map(([k, v]) => (
                    <tr key={k}>
                      <td>
                        <code>{k}</code>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(v.click)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(v.install)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(v.open)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(v.conversion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="lkd__col">
          <Card title="Status" padding="md">
            <div className="lkd__status">
              {statusBadge}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleActive(!data.is_active)}
                loading={update.isPending}
              >
                {data.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
            <p className="lkd__hint">
              Deactivating returns 404 from the public redirect endpoint. Use Delete
              for permanent removal — historical events are preserved.
            </p>
          </Card>

          <Card title="QR code" padding="md">
            <img className="lkd__qr" src={qrUrl} alt={`QR for ${shortCode}`} />
            <p className="lkd__hint">
              Adds <code>?ref=qr</code> automatically. 24h cache.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(qrUrl, '_blank')}
            >
              Download PNG
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${shortCode}`}
        size="lg"
      >
        <LinkForm
          lockShortCode
          initial={{
            short_code: data.short_code,
            app_id: data.app?.id ?? data.app_id ?? undefined,
            name: data.name ?? '',
            deep_link: data.deep_link,
            fallback_url: data.fallback_url,
            expires_at: data.expires_at,
            social_meta: data.social_meta,
            utm_params: data.utm_params,
            payload: data.payload,
          }}
          submitLabel="Save changes"
          loading={update.isPending}
          onCancel={() => setEditOpen(false)}
          onSubmit={(input) =>
            update.mutate(
              {
                name: input.name ?? '',
                deep_link: input.deep_link,
                fallback_url: input.fallback_url,
                expires_at: input.expires_at,
                social_meta: input.social_meta,
                utm_params: input.utm_params,
                payload: input.payload,
              },
              {
                onSuccess: () => {
                  toast.success('Link updated')
                  setEditOpen(false)
                  link.refetch()
                },
                onError: (err) => toast.error(extractError(err)),
              },
            )
          }
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${shortCode}?`}
        description="The link will become invisible to all reads (resolve, list, clone, match). Historical events are preserved for analytics. This cannot be undone from the admin panel."
        confirmText="Delete link"
        destructive
        loading={remove.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </>
  )
}
