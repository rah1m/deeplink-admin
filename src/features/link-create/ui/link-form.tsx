import { useState, type FormEvent } from 'react'
import { Input, Textarea, Select, Button } from '@shared/ui'
import { useApps, type App } from '@entities/app'
import type { CreateLinkInput, UtmParams } from '@entities/link'
import type { SocialMeta } from '@entities/app'
import './link-form.css'

interface LinkFormProps {
  initial?: Partial<CreateLinkInput>
  submitLabel: string
  loading?: boolean
  onSubmit: (input: CreateLinkInput) => void
  onCancel?: () => void
  lockShortCode?: boolean
}

export function LinkForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
  onCancel,
  lockShortCode,
}: LinkFormProps) {
  const apps = useApps()

  const [shortCode, setShortCode] = useState(initial?.short_code ?? '')
  const [appId, setAppId] = useState<string>(initial?.app_id?.toString() ?? '')
  const [deepLink, setDeepLink] = useState(initial?.deep_link ?? '')
  const [fallbackUrl, setFallbackUrl] = useState(initial?.fallback_url ?? '')
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ?? '')

  const meta = initial?.social_meta ?? {}
  const [metaTitle, setMetaTitle] = useState(meta.title ?? '')
  const [metaDesc, setMetaDesc] = useState(meta.description ?? '')
  const [metaImage, setMetaImage] = useState(meta.image ?? '')

  const utm = initial?.utm_params ?? {}
  const [utmSource, setUtmSource] = useState(utm.utm_source ?? '')
  const [utmMedium, setUtmMedium] = useState(utm.utm_medium ?? '')
  const [utmCampaign, setUtmCampaign] = useState(utm.utm_campaign ?? '')
  const [utmTerm, setUtmTerm] = useState(utm.utm_term ?? '')
  const [utmContent, setUtmContent] = useState(utm.utm_content ?? '')

  const [payloadText, setPayloadText] = useState(
    initial?.payload ? JSON.stringify(initial.payload, null, 2) : '',
  )
  const [payloadError, setPayloadError] = useState<string>()

  const handle = (e: FormEvent) => {
    e.preventDefault()

    let payload: Record<string, unknown> | undefined
    if (payloadText.trim()) {
      try {
        payload = JSON.parse(payloadText)
      } catch {
        setPayloadError('Invalid JSON')
        return
      }
    }
    setPayloadError(undefined)

    const social: SocialMeta = {}
    if (metaTitle) social.title = metaTitle
    if (metaDesc) social.description = metaDesc
    if (metaImage) social.image = metaImage

    const utmOut: UtmParams = {}
    if (utmSource) utmOut.utm_source = utmSource
    if (utmMedium) utmOut.utm_medium = utmMedium
    if (utmCampaign) utmOut.utm_campaign = utmCampaign
    if (utmTerm) utmOut.utm_term = utmTerm
    if (utmContent) utmOut.utm_content = utmContent

    onSubmit({
      short_code: shortCode || undefined,
      app_id: appId ? Number(appId) : undefined,
      deep_link: deepLink,
      fallback_url: fallbackUrl,
      expires_at: expiresAt || undefined,
      social_meta: Object.keys(social).length ? social : undefined,
      utm_params: Object.keys(utmOut).length ? utmOut : undefined,
      payload,
    })
  }

  return (
    <form className="link-form" onSubmit={handle}>
      <div className="link-form__grid">
        <Input
          label="Short code"
          placeholder="auto-generated if blank"
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          disabled={lockShortCode}
          hint={lockShortCode ? 'Short code cannot be changed' : undefined}
        />
        <Select
          label="App"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          hint={apps.isLoading ? 'Loading apps…' : undefined}
        >
          <option value="">— None —</option>
          {apps.data?.map((a: App) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Deep link *"
        required
        placeholder="myapp://product/123"
        value={deepLink}
        onChange={(e) => setDeepLink(e.target.value)}
      />
      <Input
        label="Fallback URL *"
        required
        type="url"
        placeholder="https://example.com/landing"
        value={fallbackUrl}
        onChange={(e) => setFallbackUrl(e.target.value)}
      />
      <Input
        label="Expires at"
        type="datetime-local"
        value={expiresAt ? expiresAt.slice(0, 16) : ''}
        onChange={(e) =>
          setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')
        }
        hint="Leave blank for no expiry"
      />

      <div className="link-form__section">Social meta (Open Graph)</div>
      <div className="link-form__grid">
        <Input
          label="OG title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
        />
        <Input
          label="OG image URL"
          value={metaImage}
          onChange={(e) => setMetaImage(e.target.value)}
        />
      </div>
      <Textarea
        label="OG description"
        rows={2}
        value={metaDesc}
        onChange={(e) => setMetaDesc(e.target.value)}
      />

      <div className="link-form__section">UTM parameters</div>
      <div className="link-form__grid">
        <Input
          label="utm_source"
          value={utmSource}
          onChange={(e) => setUtmSource(e.target.value)}
        />
        <Input
          label="utm_medium"
          value={utmMedium}
          onChange={(e) => setUtmMedium(e.target.value)}
        />
      </div>
      <div className="link-form__grid">
        <Input
          label="utm_campaign"
          value={utmCampaign}
          onChange={(e) => setUtmCampaign(e.target.value)}
        />
        <Input
          label="utm_term"
          value={utmTerm}
          onChange={(e) => setUtmTerm(e.target.value)}
        />
      </div>
      <Input
        label="utm_content"
        value={utmContent}
        onChange={(e) => setUtmContent(e.target.value)}
      />

      <div className="link-form__section">Payload (free-form JSON)</div>
      <Textarea
        rows={5}
        placeholder={`{\n  "screen": "tariffs",\n  "promo_code": "SUMMER26"\n}`}
        value={payloadText}
        onChange={(e) => setPayloadText(e.target.value)}
        error={payloadError}
        hint="Returned to the SDK on link fetch"
      />

      <div className="link-form__actions">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
