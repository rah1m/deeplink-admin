import { useId, useState, type FormEvent } from 'react'
import { Input, Textarea, Select, Button } from '@shared/ui'
import { useAllowedApps, type App } from '@entities/app'
import type { CreateLinkInput, UtmParams } from '@entities/link'
import type { SocialMeta } from '@entities/app'
import { cn, httpUrlError } from '@shared/lib'
import './link-form.css'

interface LinkFormProps {
  initial?: Partial<CreateLinkInput>
  submitLabel: string
  loading?: boolean
  onSubmit: (input: CreateLinkInput) => void
  onCancel?: () => void
  lockShortCode?: boolean
  /** Updates can't move a link to another app, so edit mode shows it read-only. */
  lockApp?: boolean
}

export function LinkForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
  onCancel,
  lockShortCode,
  lockApp,
}: LinkFormProps) {
  const apps = useAllowedApps()

  const [shortCode, setShortCode] = useState(initial?.short_code ?? '')
  const [appId, setAppId] = useState<string>(initial?.app_id?.toString() ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [deepLink, setDeepLink] = useState(initial?.deep_link ?? '')
  // A link with no stored fallback follows its app's default.
  const [fallbackMode, setFallbackMode] = useState<'app' | 'custom'>(
    initial?.fallback_url ? 'custom' : 'app',
  )
  const [fallbackUrl, setFallbackUrl] = useState(initial?.fallback_url ?? '')
  const [fallbackError, setFallbackError] = useState<string>()
  const fallbackRadio = useId()
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
  // A single permitted app is the only possible answer, so it needn't be picked.
  const effectiveAppId =
    appId || (apps.data?.length === 1 ? String(apps.data[0].id) : '')
  const selectedApp = apps.data?.find((a: App) => a.id === Number(effectiveAppId))
  const iosScheme = selectedApp?.ios_url_scheme
  const androidScheme = selectedApp?.android_url_scheme
  // Per-platform schemes can diverge (e.g. iOS bakcell:// vs Android bakcellapp://).
  const schemesDiffer = !!iosScheme && !!androidScheme && iosScheme !== androidScheme
  // Single inline prefix only when unambiguous: same value, or only one platform set.
  const singlePrefix = schemesDiffer ? undefined : iosScheme ?? androidScheme
  // Live preview of what the server composes per platform.
  const previewPath = deepLink.trim().replace(/^\/+/, '') || 'product/123'
  const appFallback = selectedApp?.default_fallback_url

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

    const customFallback = fallbackUrl.trim()
    if (fallbackMode === 'custom') {
      const err = customFallback
        ? httpUrlError(customFallback)
        : 'Enter a URL, or use the app default'
      if (err) {
        setFallbackError(err)
        return
      }
    }
    setFallbackError(undefined)

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
      app_id: Number(effectiveAppId),
      name: name || undefined,
      deep_link: deepLinkPath,
      fallback_url: fallbackMode === 'custom' ? customFallback : '',
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
          label={lockApp ? 'App' : 'App *'}
          required
          value={effectiveAppId}
          onChange={(e) => setAppId(e.target.value)}
          disabled={lockApp}
          hint={
            apps.isLoading
              ? 'Loading apps…'
              : lockApp
                ? 'App cannot be changed'
                : undefined
          }
        >
          <option value="" disabled>
            Select an app…
          </option>
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
      <div className="ui-field">
        <span className="ui-field__label">Fallback URL</span>
        <div className="link-form__choice">
          <label className="link-form__radio">
            <input
              type="radio"
              name={fallbackRadio}
              checked={fallbackMode === 'app'}
              onChange={() => {
                setFallbackMode('app')
                setFallbackError(undefined)
              }}
            />
            App default
            {appFallback && <code>{appFallback}</code>}
          </label>
          <label className="link-form__radio">
            <input
              type="radio"
              name={fallbackRadio}
              checked={fallbackMode === 'custom'}
              onChange={() => setFallbackMode('custom')}
            />
            Custom URL
          </label>
        </div>
        {fallbackMode === 'custom' ? (
          <>
            <Input
              type="url"
              aria-label="Custom fallback URL"
              placeholder="https://example.com/landing"
              value={fallbackUrl}
              onChange={(e) => {
                setFallbackUrl(e.target.value)
                setFallbackError(undefined)
              }}
              error={fallbackError}
            />
            {!fallbackError && (
              <span className="ui-field__hint">
                This link only — changes to the app default won't affect it.
              </span>
            )}
          </>
        ) : !selectedApp ? (
          <span className="ui-field__hint">
            Select an app to use its default.
          </span>
        ) : appFallback ? (
          <span className="ui-field__hint">
            Where clicks the app can't open go (desktop, or no store URL). The
            link follows the app default if it changes later.
          </span>
        ) : (
          <span className="link-form__warn">
            {selectedApp.name} has no default fallback URL — desktop clicks
            will land on the domain root. Set one on the Apps page, or use a
            custom URL.
          </span>
        )}
      </div>
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
