import { useState, type FormEvent } from 'react'
import { Input, Textarea, Button } from '@shared/ui'
import type { CreateAppInput, SocialMeta } from '@entities/app'
import './app-form.css'

interface AppFormProps {
  initial?: Partial<CreateAppInput>
  submitLabel: string
  loading?: boolean
  onSubmit: (input: CreateAppInput) => void
  onCancel?: () => void
}

export function AppForm({ initial, submitLabel, loading, onSubmit, onCancel }: AppFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [iosBundle, setIosBundle] = useState(initial?.ios_bundle_id ?? '')
  const [iosTeam, setIosTeam] = useState(initial?.ios_team_id ?? '')
  const [androidPkg, setAndroidPkg] = useState(initial?.android_package ?? '')
  const [androidSha, setAndroidSha] = useState(initial?.android_sha256_fingerprint ?? '')
  const [appStoreUrl, setAppStoreUrl] = useState(initial?.app_store_url ?? '')
  const [playStoreUrl, setPlayStoreUrl] = useState(initial?.play_store_url ?? '')

  const meta = initial?.social_meta ?? {}
  const [metaTitle, setMetaTitle] = useState(meta.title ?? '')
  const [metaDesc, setMetaDesc] = useState(meta.description ?? '')
  const [metaImage, setMetaImage] = useState(meta.image ?? '')

  const handle = (e: FormEvent) => {
    e.preventDefault()
    const social: SocialMeta = {}
    if (metaTitle) social.title = metaTitle
    if (metaDesc) social.description = metaDesc
    if (metaImage) social.image = metaImage

    onSubmit({
      name,
      ios_bundle_id: iosBundle || undefined,
      ios_team_id: iosTeam || undefined,
      android_package: androidPkg || undefined,
      android_sha256_fingerprint: androidSha || undefined,
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
