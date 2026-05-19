import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import {
  serviceTokenApi,
  serviceTokenQueryKeys,
  useServiceTokens,
  type CreateServiceTokenResponse,
  type ServiceToken,
} from '@entities/service-token'
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Spinner,
  useToast,
} from '@shared/ui'
import { copyToClipboard, formatDate } from '@shared/lib'
import { extractError } from '@shared/api'
import './ui.css'

function useCreateServiceToken(appId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => serviceTokenApi.create(appId, { name }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: serviceTokenQueryKeys.byApp(appId) }),
  })
}

function useRevokeServiceToken(appId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tokenId: number) => serviceTokenApi.revoke(tokenId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: serviceTokenQueryKeys.byApp(appId) }),
  })
}

interface ServiceTokensManagerProps {
  appId: number
  appName: string
}

export function ServiceTokensManager({ appId, appName }: ServiceTokensManagerProps) {
  const toast = useToast()
  const tokens = useServiceTokens(appId)
  const create = useCreateServiceToken(appId)
  const revoke = useRevokeServiceToken(appId)

  const [name, setName] = useState('')
  const [reveal, setReveal] = useState<CreateServiceTokenResponse | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<ServiceToken | null>(null)

  const onCreate = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    create.mutate(trimmed, {
      onSuccess: (res) => {
        setReveal(res)
        setName('')
      },
      onError: (err) => toast.error(extractError(err)),
    })
  }

  const onRevoke = (token: ServiceToken) => {
    revoke.mutate(token.id, {
      onSuccess: () => {
        toast.success(`Revoked ${token.name}`)
        setConfirmRevoke(null)
      },
      onError: (err) => toast.error(extractError(err)),
    })
  }

  const onCopy = async (key: string) => {
    await copyToClipboard(key)
    toast.success('Key copied — paste it into the brand backend env')
  }

  return (
    <div className="stok">
      <p className="stok__hint">
        Mint a service token to let a brand backend create links for{' '}
        <strong>{appName}</strong> programmatically. The token is bound to this
        app — it cannot create links elsewhere. The raw key is shown{' '}
        <strong>once</strong>; rotate by minting a new token and revoking the
        old one.
      </p>

      {reveal && (
        <div className="stok__reveal" role="alert">
          <div className="stok__reveal-title">
            New key for {reveal.token.name} — copy now
          </div>
          <div className="stok__reveal-key">{reveal.key}</div>
          <div className="stok__reveal-actions">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onCopy(reveal.key)}
            >
              Copy key
            </Button>
            <Button size="sm" onClick={() => setReveal(null)}>
              I've stored it
            </Button>
          </div>
        </div>
      )}

      <form className="stok__form" onSubmit={onCreate}>
        <div className="stok__form-input">
          <Input
            label="Token name"
            placeholder="e.g. Bakcell mobile backend"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
          />
        </div>
        <Button type="submit" loading={create.isPending} disabled={!name.trim()}>
          Mint token
        </Button>
      </form>

      {tokens.isLoading ? (
        <Spinner />
      ) : (
        <ul className="stok__list">
          {tokens.data?.map((t) => (
            <li key={t.id}>
              <div className="stok__row">
                <div className="stok__row-main">
                  <div className="stok__row-name">{t.name}</div>
                  <div className="stok__row-meta">
                    <code>{t.key_prefix}…</code>
                    <span>created {formatDate(t.created_at)}</span>
                    {t.last_used_at ? (
                      <Badge tone="success">
                        last used {formatDate(t.last_used_at)}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">never used</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmRevoke(t)}
                >
                  Revoke
                </Button>
              </div>
            </li>
          ))}
          {tokens.data && tokens.data.length === 0 && (
            <li className="stok__empty">No tokens yet.</li>
          )}
        </ul>
      )}

      <ConfirmDialog
        open={!!confirmRevoke}
        title={confirmRevoke ? `Revoke ${confirmRevoke.name}?` : ''}
        description="The brand backend using this token will start receiving 401 immediately. Existing links it created are unaffected."
        confirmText="Revoke"
        destructive
        loading={revoke.isPending}
        onCancel={() => setConfirmRevoke(null)}
        onConfirm={() => confirmRevoke && onRevoke(confirmRevoke)}
      />
    </div>
  )
}
