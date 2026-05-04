import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  CenteredSpinner,
  Modal,
  PageHeader,
  Select,
  Stat,
  useToast,
} from '@shared/ui'
import { LinkForm } from '@features/link-create'
import { useUpdateLink } from '@features/link-edit'
import { useCloneLink } from '@features/link-clone'
import {
  linkApi,
  useLinkPublic,
  useLinkStats,
  type GroupBy,
} from '@entities/link'
import { copyToClipboard, formatNumber } from '@shared/lib'
import { extractError } from '@shared/api'
import './link-detail.css'

export function LinkDetailPage() {
  const { shortCode } = useParams({ strict: false }) as { shortCode: string }
  const toast = useToast()

  const link = useLinkPublic(shortCode)
  const [groupBy, setGroupBy] = useState<GroupBy | ''>('')
  const stats = useLinkStats(shortCode, groupBy || undefined)

  const update = useUpdateLink(shortCode)
  const clone = useCloneLink(shortCode)
  const [editOpen, setEditOpen] = useState(false)

  if (link.isLoading) return <CenteredSpinner />
  if (link.isError || !link.data) {
    return <div>Link not found.</div>
  }

  const data = link.data
  const shortUrl = linkApi.shortUrl(shortCode)
  const qrUrl = linkApi.qrUrl(shortCode, 320)

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
        actions={
          <>
            <Button variant="secondary" onClick={onCopy}>
              Copy URL
            </Button>
            <Button variant="secondary" onClick={onClone} loading={clone.isPending}>
              Clone
            </Button>
            <Button onClick={() => setEditOpen(true)}>Edit</Button>
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
              <Badge tone="success">Live</Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleActive(false)}
                loading={update.isPending}
              >
                Deactivate
              </Button>
            </div>
            <p className="lkd__hint">
              Deactivating returns 404 from the public redirect endpoint.
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
            app_id: data.app?.id,
            deep_link: data.deep_link,
            utm_params: data.utm_params,
            payload: data.payload,
          }}
          submitLabel="Save changes"
          loading={update.isPending}
          onCancel={() => setEditOpen(false)}
          onSubmit={(input) =>
            update.mutate(
              {
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
    </>
  )
}
