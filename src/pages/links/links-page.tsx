import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Modal,
  PageHeader,
  Pagination,
  Select,
  useToast,
  type Column,
} from '@shared/ui'
import { LinkForm, useCreateLink } from '@features/link-create'
import { useLinks, type DynamicLink, linkApi } from '@entities/link'
import { useApps } from '@entities/app'
import { formatDate, formatNumber, copyToClipboard } from '@shared/lib'
import { extractError } from '@shared/api'

const PAGE_SIZE = 20

export function LinksPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const apps = useApps()
  const [appId, setAppId] = useState<string>('')
  const [offset, setOffset] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const params = {
    limit: PAGE_SIZE,
    offset,
    app_id: appId ? Number(appId) : undefined,
  }
  const links = useLinks(params)
  const create = useCreateLink()

  const onCopy = async (shortCode: string) => {
    await copyToClipboard(linkApi.shortUrl(shortCode))
    toast.success('Short URL copied')
  }

  const columns: Column<DynamicLink>[] = [
    {
      key: 'short',
      header: 'Short code',
      width: '160px',
      render: (l) => (
        <Link to="/links/$shortCode" params={{ shortCode: l.short_code }}>
          <code>{l.short_code}</code>
        </Link>
      ),
    },
    {
      key: 'deep',
      header: 'Deep link',
      render: (l) => <span className="ellipsis">{l.deep_link}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (l) => {
        const expired =
          l.expires_at != null && new Date(l.expires_at).getTime() < Date.now()
        if (!l.is_active) return <Badge tone="neutral">Inactive</Badge>
        if (expired) return <Badge tone="warning">Expired</Badge>
        return <Badge tone="success">Active</Badge>
      },
    },
    {
      key: 'clicks',
      header: 'Clicks',
      width: '90px',
      align: 'right',
      render: (l) => formatNumber(l.stats?.clicks),
    },
    {
      key: 'installs',
      header: 'Installs',
      width: '90px',
      align: 'right',
      render: (l) => formatNumber(l.stats?.installs),
    },
    {
      key: 'created',
      header: 'Created',
      width: '160px',
      render: (l) => (
        <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(l.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (l) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            void onCopy(l.short_code)
          }}
        >
          Copy
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Links"
        description="Create, manage and monitor every dynamic link."
        actions={<Button onClick={() => setCreateOpen(true)}>+ New link</Button>}
      />

      <Card padding="md" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ width: 240 }}>
            <Select
              label="Filter by app"
              value={appId}
              onChange={(e) => {
                setAppId(e.target.value)
                setOffset(0)
              }}
            >
              <option value="">All apps</option>
              {apps.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={links.data?.items}
        rowKey={(l) => l.id}
        loading={links.isLoading}
        empty="No links yet"
        onRowClick={(l) => navigate({ to: '/links/$shortCode', params: { shortCode: l.short_code } })}
      />

      {links.data && links.data.total > 0 && (
        <Pagination
          total={links.data.total}
          limit={links.data.limit}
          offset={links.data.offset}
          onChange={setOffset}
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create new link"
        size="lg"
      >
        <LinkForm
          submitLabel="Create link"
          loading={create.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(input) => {
            create.mutate(input, {
              onSuccess: (res) => {
                toast.success(`Created ${res.short_code}`)
                setCreateOpen(false)
              },
              onError: (err) => toast.error(extractError(err)),
            })
          }}
        />
      </Modal>
    </>
  )
}
