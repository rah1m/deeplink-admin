import { useQuery } from '@tanstack/react-query'
import { Badge, Button, CenteredSpinner, Modal } from '@shared/ui'
import type { App } from '@entities/app'
import { runDomainCheck, type PlatformCheck } from './lib'

const STATUS_TONE = {
  verified: 'success',
  missing: 'danger',
  unreachable: 'warning',
  not_configured: 'neutral',
} as const

const STATUS_LABEL = {
  verified: 'Verified',
  missing: 'Not in file',
  unreachable: 'Unreachable',
  not_configured: 'Not configured',
} as const

function CheckRow({ title, check }: { title: string; check: PlatformCheck }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <Badge tone={STATUS_TONE[check.status]}>
          {STATUS_LABEL[check.status]}
        </Badge>
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        {check.detail}
      </span>
      {check.url && (
        <a
          href={check.url}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11, wordBreak: 'break-all' }}
        >
          {check.url}
        </a>
      )}
    </div>
  )
}

export function DomainCheckModal({
  app,
  onClose,
}: {
  app: App
  onClose: () => void
}) {
  const check = useQuery({
    queryKey: ['app-domain-check', app.id, app.domain],
    queryFn: () => runDomainCheck(app),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  const anyUnreachable =
    check.data?.ios.status === 'unreachable' ||
    check.data?.android.status === 'unreachable'

  return (
    <Modal
      open
      onClose={onClose}
      title={`Domain check — ${app.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => check.refetch()}
            loading={check.isFetching}
            disabled={!app.domain}
          >
            Re-check
          </Button>
        </>
      }
    >
      {check.isLoading ? (
        <CenteredSpinner />
      ) : check.data ? (
        <>
          {check.data.origin && (
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 12,
                color: 'var(--color-text-muted)',
              }}
            >
              Checking the live files Apple and Google see on{' '}
              <code>{check.data.origin}</code>.
            </p>
          )}
          <CheckRow title="iOS — Universal Links (AASA)" check={check.data.ios} />
          <CheckRow
            title="Android — App Links (assetlinks.json)"
            check={check.data.android}
          />
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 11,
              color: 'var(--color-text-subtle)',
            }}
          >
            {anyUnreachable
              ? 'Unreachable from the browser is not always fatal — Apple and Google fetch server-side, so a CORS or VPN issue here may not affect them. A routing or TLS failure, however, affects everyone.'
              : 'Files are cached for 1h server-side; a just-saved change may take up to an hour to appear.'}
          </p>
        </>
      ) : null}
    </Modal>
  )
}
