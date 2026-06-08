import { useState, type FormEvent } from 'react'
import { Input, Textarea, Select, Button } from '@shared/ui'
import { useApps, type App } from '@entities/app'
import type { CreateLinkInput, UtmParams } from '@entities/link'
import type { SocialMeta } from '@entities/app'
import { cn } from '@shared/lib'
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
  const [name, setName] = useState(initial?.name ?? '')
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
  const [deepLinkError, setDeepLinkError] = useState<string>()

  // SRE-0004: deep_link is now a scheme-less PATH. The selected app's scheme is
  // shown as a static prefix; the server composes the full per-platform URI.
  const selectedApp = apps.data?.find((a: App) => a.id === Number(appId))
  const iosScheme = selectedApp?.ios_url_scheme
  const androidScheme = selectedApp?.android_url_scheme
  // Per-platform schemes can diverge (e.g. iOS bakcell:// vs Android bakcellapp://).
  const schemesDiffer = !!iosScheme && !!androidScheme && iosScheme !== androidScheme
  // Single inline prefix only when unambiguous: same value, or only one platform set.
  const singlePrefix = schemesDiffer ? undefined : iosScheme ?? androidScheme
  // Live preview of what the server composes per platform.
  const previewPath = deepLink.trim().replace(/^\/+/, '') || 'product/123'

  const handle = (e: FormEvent) => {
    e.preventDefault()

    // Mirror the server: strip leading slashes, reject a full URI.
    const deepLinkPath = deepLink.trim().replace(/^\/+/, '')
    if (!deepLinkPath) {
      setDeepLinkError('Deep link is required')
      return
    }
    if (deepLinkPath.includes('://')) {
      setDeepLinkError(
        'Deep link is now a path — drop the scheme (e.g. "product/123", not "myapp://product/123"). The app\'s scheme is added automatically.',
      )
      return
    }
    setDeepLinkError(undefined)

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
      name: name || undefined,
      deep_link: deepLinkPath,
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
        label="Name"
        placeholder="Yay-26 SMS — Bakcell"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
        hint="Internal admin label shown to your team. Not the public OG title."
      />
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="link-deep-link">
          Deep link *
        </label>
        <div
          className={cn(
            'link-form__affix',
            deepLinkError && 'link-form__affix--error',
          )}
        >
          {singlePrefix && (
            <span className="link-form__affix-prefix">{singlePrefix}://</span>
          )}
          <input
            id="link-deep-link"
            className="ui-input link-form__affix-input"
            required
            placeholder="product/123"
            value={deepLink}
            onChange={(e) => {
              setDeepLink(e.target.value)
              setDeepLinkError(undefined)
            }}
          />
        </div>
        {deepLinkError ? (
          <span className="ui-field__error">{deepLinkError}</span>
        ) : (
          <span className="ui-field__hint">
            {schemesDiffer
              ? 'Path only — composed per platform below (iOS and Android schemes differ).'
              : singlePrefix
                ? `Path only — the app's scheme (${singlePrefix}://) is added automatically at resolve time.`
                : 'Path only, e.g. product/123 (no scheme). The app\'s URL scheme is prepended automatically.'}
          </span>
        )}
        {schemesDiffer && (
          <div className="link-form__compose">
            <div className="link-form__compose-row">
              <span className="link-form__compose-os">iOS</span>
              <code>
                {iosScheme}://{previewPath}
              </code>
            </div>
            <div className="link-form__compose-row">
              <span className="link-form__compose-os">Android</span>
              <code>
                {androidScheme}://{previewPath}
              </code>
            </div>
          </div>
        )}
      </div>
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
