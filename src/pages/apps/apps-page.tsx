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
import { DomainCheckModal } from '@features/app-domain-check'
import { useUpdateApp } from '@features/app-edit'
import { ServiceTokensManager } from '@features/service-tokens'
import {
  desktopModeShortLabel,
  isDesktopModeError,
  useApps,
  type App,
} from '@entities/app'
import { useSession } from '@entities/session'
import { extractError } from '@shared/api'

/** A platform is configured once it has both its app id and its URL scheme —
 * the resolver needs both. The values themselves are on hover. */
function PlatformBadge({ id, scheme }: { id?: string; scheme?: string }) {
  const title = [id, scheme && `${scheme}://`].filter(Boolean).join(' · ')
  return (
    <span title={title || undefined}>
      {id && scheme ? (
        <Badge tone="success">configured</Badge>
      ) : id || scheme ? (
        <Badge tone="warning">partial</Badge>
      ) : (
        <Badge tone="neutral">missing</Badge>
      )}
    </span>
  )
}

export function AppsPage() {
  const apps = useApps()
  const isSuper = useSession((s) => s.isSuperAdmin())
  const toast = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<App | null>(null)
  const [tokensFor, setTokensFor] = useState<App | null>(null)
  const [checking, setChecking] = useState<App | null>(null)
  // A desktop_mode 400 goes on the field; anything else stays a toast.
  const [desktopModeErr, setDesktopModeErr] = useState<string>()
  const onSaveError = (err: unknown) => {
    const msg = extractError(err)
    if (isDesktopModeError(msg)) setDesktopModeErr(msg)
    else toast.error(msg)
  }

  const create = useCreateApp()
  const update = useUpdateApp(editing?.id ?? 0)

  const columns: Column<App>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (a) => <strong>{a.name}</strong>,
    },
    {
      key: 'domain',
      header: 'Domain',
      render: (a) =>
        a.domain ? <code>{a.domain}</code> : <span style={{ color: 'var(--color-text-subtle)' }}>—</span>,
    },
    {
      key: 'fallback',
      header: 'Default fallback',
      render: (a) =>
        a.default_fallback_url ? (
          <code>{a.default_fallback_url}</code>
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'desktop',
      header: 'Desktop',
      render: (a) =>
        a.desktop_mode ? (
          desktopModeShortLabel[a.desktop_mode]
        ) : (
          <span style={{ color: 'var(--color-text-subtle)' }}>—</span>
        ),
    },
    {
      key: 'ios',
      header: 'iOS',
      render: (a) => <PlatformBadge id={a.ios_bundle_id} scheme={a.ios_url_scheme} />,
    },
    {
      key: 'android',
      header: 'Android',
      render: (a) => (
        <PlatformBadge id={a.android_package} scheme={a.android_url_scheme} />
      ),
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
      key: 'actions',
      header: '',
      align: 'right',
      width: '200px',
      render: (a) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" onClick={() => setChecking(a)}>
            Verify
          </Button>
          {isSuper && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setTokensFor(a)}>
                Tokens
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDesktopModeErr(undefined)
                  setEditing(a)
                }}
              >
                Edit
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Apps"
        description="iOS and Android app configurations served via AASA / assetlinks."
        actions={
          isSuper ? (
            <Button
              onClick={() => {
                setDesktopModeErr(undefined)
                setCreateOpen(true)
              }}
            >
              + New app
            </Button>
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
          mode="create"
          submitLabel="Create app"
          loading={create.isPending}
          onCancel={() => setCreateOpen(false)}
          desktopModeError={desktopModeErr}
          onDesktopModeChange={() => setDesktopModeErr(undefined)}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: () => {
                toast.success('App created')
                setCreateOpen(false)
              },
              onError: onSaveError,
            })
          }
        />
      </Modal>

      <Modal
        open={!!tokensFor}
        onClose={() => setTokensFor(null)}
        title={tokensFor ? `Service tokens — ${tokensFor.name}` : ''}
        size="lg"
      >
        {tokensFor && (
          <ServiceTokensManager appId={tokensFor.id} appName={tokensFor.name} />
        )}
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : ''}
        size="lg"
      >
        {editing && (
          <AppForm
            mode="edit"
            initial={editing}
            app={editing}
            submitLabel="Save"
            loading={update.isPending}
            onCancel={() => setEditing(null)}
            desktopModeError={desktopModeErr}
            onDesktopModeChange={() => setDesktopModeErr(undefined)}
            onSubmit={(input) =>
              update.mutate(input, {
                onSuccess: () => {
                  toast.success('App updated')
                  setEditing(null)
                },
                onError: onSaveError,
              })
            }
          />
        )}
      </Modal>

      {checking && (
        <DomainCheckModal app={checking} onClose={() => setChecking(null)} />
      )}
    </>
  )
}
