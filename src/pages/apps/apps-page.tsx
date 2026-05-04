import { useState } from 'react'
import {
  Badge,
  Button,
  DataTable,
  Modal,
  PageHeader,
  useToast,
  type Column,
} from '@shared/ui'
import { AppForm, useCreateApp } from '@features/app-create'
import { useUpdateApp } from '@features/app-edit'
import { useApps, type App } from '@entities/app'
import { useSession } from '@entities/session'
import { extractError } from '@shared/api'
import { formatDate } from '@shared/lib'

export function AppsPage() {
  const apps = useApps()
  const isSuper = useSession((s) => s.isSuperAdmin())
  const toast = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<App | null>(null)

  const create = useCreateApp()
  const update = useUpdateApp(editing?.id ?? 0)

  const columns: Column<App>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (a) => <strong>{a.name}</strong>,
    },
    {
      key: 'ios',
      header: 'iOS bundle',
      render: (a) =>
        a.ios_bundle_id ? <code>{a.ios_bundle_id}</code> : <span style={{ color: 'var(--color-text-subtle)' }}>—</span>,
    },
    {
      key: 'android',
      header: 'Android package',
      render: (a) =>
        a.android_package ? <code>{a.android_package}</code> : <span style={{ color: 'var(--color-text-subtle)' }}>—</span>,
    },
    {
      key: 'sha',
      header: 'SHA-256',
      render: (a) =>
        a.android_sha256_fingerprint ? (
          <Badge tone="success">configured</Badge>
        ) : (
          <Badge tone="neutral">missing</Badge>
        ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (a) => (
        <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(a.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '90px',
      render: (a) =>
        isSuper ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
            Edit
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Apps"
        description="iOS and Android app configurations served via AASA / assetlinks."
        actions={
          isSuper ? (
            <Button onClick={() => setCreateOpen(true)}>+ New app</Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={apps.data}
        rowKey={(a) => a.id}
        loading={apps.isLoading}
        empty="No apps yet — create the first one to enable Universal/App Links."
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register new app"
        size="lg"
      >
        <AppForm
          submitLabel="Create app"
          loading={create.isPending}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: () => {
                toast.success('App created')
                setCreateOpen(false)
              },
              onError: (err) => toast.error(extractError(err)),
            })
          }
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : ''}
        size="lg"
      >
        {editing && (
          <AppForm
            initial={editing}
            submitLabel="Save"
            loading={update.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(input) =>
              update.mutate(input, {
                onSuccess: () => {
                  toast.success('App updated')
                  setEditing(null)
                },
                onError: (err) => toast.error(extractError(err)),
              })
            }
          />
        )}
      </Modal>
    </>
  )
}
