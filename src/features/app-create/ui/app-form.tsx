import { useState, type FormEvent } from 'react'
import { Input, Textarea, Button } from '@shared/ui'
import type { CreateAppInput, SocialMeta } from '@entities/app'
import './app-form.css'

interface AppFormProps {
  /** create requires both URL schemes (SRE-0004); edit keeps them optional. */
  mode: 'create' | 'edit'
  initial?: Partial<CreateAppInput>
  submitLabel: string
  loading?: boolean
  onSubmit: (input: CreateAppInput) => void
  onCancel?: () => void
}

// RFC 3986 §3.1 — now server-enforced. Drop a pasted "bakcell://" separator and
// lower-case so the value matches what the resolver composes deep links from.
const SCHEME_RE = /^[a-z][a-z0-9+\-.]*$/

function normalizeScheme(raw: string): string {
  return raw.trim().replace(/:\/\/.*$/, '').toLowerCase()
}

export function AppForm({ mode, initial, submitLabel, loading, onSubmit, onCancel }: AppFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [domain, setDomain] = useState(initial?.domain ?? '')
  const [iosBundle, setIosBundle] = useState(initial?.ios_bundle_id ?? '')
  const [iosTeam, setIosTeam] = useState(initial?.ios_team_id ?? '')
  const [iosScheme, setIosScheme] = useState(initial?.ios_url_scheme ?? '')
  const [androidPkg, setAndroidPkg] = useState(initial?.android_package ?? '')
  const [androidSha, setAndroidSha] = useState(initial?.android_sha256_fingerprint ?? '')
  const [androidScheme, setAndroidScheme] = useState(initial?.android_url_scheme ?? '')
  const [appStoreUrl, setAppStoreUrl] = useState(initial?.app_store_url ?? '')
  const [playStoreUrl, setPlayStoreUrl] = useState(initial?.play_store_url ?? '')

  // "Same as iOS" reflects the common case (95% of apps share the scheme).
  // Start checked only when both schemes already match, to keep edits honest.
  const [sameScheme, setSameScheme] = useState(
    !!(initial?.ios_url_scheme && initial.ios_url_scheme === initial.android_url_scheme),
  )

  const effectiveAndroidScheme = sameScheme ? iosScheme : androidScheme

  // Submit-time errors (mirror the server). Cleared as the user edits.
  const [iosSchemeErr, setIosSchemeErr] = useState<string>()
  const [androidSchemeErr, setAndroidSchemeErr] = useState<string>()

  const meta = initial?.social_meta ?? {}
  const [metaTitle, setMetaTitle] = useState(meta.title ?? '')
  const [metaDesc, setMetaDesc] = useState(meta.description ?? '')
  const [metaImage, setMetaImage] = useState(meta.image ?? '')

  const handle = (e: FormEvent) => {
    e.preventDefault()

    // SRE-0004: schemes are the resolver's source of truth — required on create,
    // optional on edit (omitting leaves the existing value untouched).
    const required = mode === 'create'
    const iosNorm = normalizeScheme(iosScheme)
    const androidNorm = sameScheme ? iosNorm : normalizeScheme(androidScheme)

    const validate = (v: string): string | undefined => {
      if (!v) return required ? 'URL scheme is required' : undefined
      if (!SCHEME_RE.test(v))
        return 'Invalid scheme — lowercase letters, digits, + - . only (no "://" or path)'
      return undefined
    }
    const iosErr = validate(iosNorm)
    const androidErr = sameScheme ? iosErr : validate(androidNorm)
    setIosSchemeErr(iosErr)
    setAndroidSchemeErr(sameScheme ? undefined : androidErr)
    if (iosErr || androidErr) return

    const social: SocialMeta = {}
    if (metaTitle) social.title = metaTitle
    if (metaDesc) social.description = metaDesc
    if (metaImage) social.image = metaImage

    onSubmit({
      name,
      domain: domain || undefined,
      ios_bundle_id: iosBundle || undefined,
      ios_team_id: iosTeam || undefined,
      ios_url_scheme: iosNorm || undefined,
      android_package: androidPkg || undefined,
      android_sha256_fingerprint: androidSha || undefined,
      android_url_scheme: androidNorm || undefined,
      app_store_url: appStoreUrl || undefined,
      play_store_url: playStoreUrl || undefined,
      social_meta: Object.keys(social).length ? social : undefined,
    })
  }

  return (
    <form className="app-form" onSubmit={handle}>
      <Input
        label="App name *"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Domain"
        placeholder="link.example.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        hint="Per-app subdomain that serves AASA / assetlinks. Required for multi-app setups to avoid Universal Link claim collisions."
      />

      <div className="app-form__section">iOS</div>
      <div className="app-form__grid">
        <Input
          label="Bundle ID"
          placeholder="com.example.app"
          value={iosBundle}
          onChange={(e) => setIosBundle(e.target.value)}
        />
        <Input
          label="Team ID"
          placeholder="ABCD1234EF"
          value={iosTeam}
          onChange={(e) => setIosTeam(e.target.value)}
        />
      </div>
      <Input
        label={mode === 'create' ? 'iOS URL Scheme *' : 'iOS URL Scheme'}
        placeholder="bakcell"
        maxLength={64}
        value={iosScheme}
        onChange={(e) => {
          setIosScheme(e.target.value)
          setIosSchemeErr(undefined)
        }}
        error={iosSchemeErr}
        hint="e.g. bakcell — the app's URL scheme. Every deep link is built from it. Usually the same value on both platforms."
      />
      <Input
        label="App Store URL"
        type="url"
        value={appStoreUrl}
        onChange={(e) => setAppStoreUrl(e.target.value)}
      />

      <div className="app-form__section">Android</div>
      <Input
        label="Package name"
        placeholder="com.example.app"
        value={androidPkg}
        onChange={(e) => setAndroidPkg(e.target.value)}
      />
      <Textarea
        label="SHA-256 fingerprints"
        rows={2}
        placeholder="AA:BB:CC:..., DD:EE:FF:..."
        value={androidSha}
        onChange={(e) => setAndroidSha(e.target.value)}
        hint="Comma-separated for multiple keys"
      />
      <Input
        label={mode === 'create' ? 'Android URL Scheme *' : 'Android URL Scheme'}
        placeholder="bakcell"
        maxLength={64}
        value={effectiveAndroidScheme}
        disabled={sameScheme}
        onChange={(e) => {
          setAndroidScheme(e.target.value)
          setAndroidSchemeErr(undefined)
        }}
        error={sameScheme ? undefined : androidSchemeErr}
        hint="e.g. bakcell — the app's URL scheme. Every deep link is built from it. Usually the same value on both platforms."
      />
      <label className="app-form__checkbox">
        <input
          type="checkbox"
          checked={sameScheme}
          onChange={(e) => setSameScheme(e.target.checked)}
        />
        Same as iOS URL Scheme
      </label>
      <Input
        label="Play Store URL"
        type="url"
        value={playStoreUrl}
        onChange={(e) => setPlayStoreUrl(e.target.value)}
      />

      <div className="app-form__section">Social meta</div>
      <Input
        label="OG title"
        value={metaTitle}
        onChange={(e) => setMetaTitle(e.target.value)}
      />
      <Textarea
        label="OG description"
        rows={2}
        value={metaDesc}
        onChange={(e) => setMetaDesc(e.target.value)}
      />
      <Input
        label="OG image URL"
        value={metaImage}
        onChange={(e) => setMetaImage(e.target.value)}
      />

      <div className="app-form__actions">
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
