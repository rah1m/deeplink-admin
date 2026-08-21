import type { App } from '@entities/app'

export type PlatformCheckStatus =
  /** File fetched and this app's entry is present and complete. */
  | 'verified'
  /** File fetched fine, but this app's entry is absent or incomplete. */
  | 'missing'
  /** Fetch failed: domain not routed, TLS, CORS, non-200 or invalid JSON. */
  | 'unreachable'
  /** The app record lacks the fields this platform needs. */
  | 'not_configured'

export interface PlatformCheck {
  status: PlatformCheckStatus
  detail: string
  url: string
}

export interface DomainCheckResult {
  origin: string | null
  ios: PlatformCheck
  android: PlatformCheck
}

// Same normalization the backend applies to apps.domain (wellknown.go
// matches on the bare lowercase host), mirroring linkOrigin in @entities/link.
function originFor(domain?: string | null): string | null {
  const d = domain?.trim().replace(/\/+$/, '')
  if (!d) return null
  return /^https?:\/\//i.test(d) ? d : `https://${d}`
}

// Plain GET with no credentials or custom headers — a simple CORS request,
// the closest a browser can get to how Apple/Google fetch these files.
async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function collectAppIds(doc: unknown): string[] {
  const details = (doc as { applinks?: { details?: unknown } })?.applinks
    ?.details
  const served: string[] = []
  if (Array.isArray(details)) {
    for (const d of details) {
      const ids = (d as { appIDs?: unknown })?.appIDs
      if (Array.isArray(ids)) {
        for (const id of ids) if (typeof id === 'string') served.push(id)
      }
      const single = (d as { appID?: unknown })?.appID
      if (typeof single === 'string') served.push(single)
    }
  }
  return served
}

async function checkIos(app: App, origin: string): Promise<PlatformCheck> {
  const url = `${origin}/.well-known/apple-app-site-association`
  if (!app.ios_bundle_id || !app.ios_team_id) {
    return {
      status: 'not_configured',
      detail: 'Needs both iOS bundle id and team id on the app.',
      url,
    }
  }
  const expected = `${app.ios_team_id}.${app.ios_bundle_id}`
  try {
    const served = collectAppIds(await fetchJson(url))
    if (served.includes(expected)) {
      return { status: 'verified', detail: `appID ${expected} is served.`, url }
    }
    return {
      status: 'missing',
      detail:
        served.length > 0
          ? `File is served, but ${expected} is not among its ${served.length} appID(s).`
          : 'File is served with an empty details list.',
      url,
    }
  } catch (e) {
    return { status: 'unreachable', detail: String(e), url }
  }
}

interface AssetLinkEntry {
  target?: {
    namespace?: unknown
    package_name?: unknown
    sha256_cert_fingerprints?: unknown
  }
}

async function checkAndroid(app: App, origin: string): Promise<PlatformCheck> {
  const url = `${origin}/.well-known/assetlinks.json`
  if (!app.android_package || !app.android_sha256_fingerprint) {
    return {
      status: 'not_configured',
      detail: 'Needs both Android package and SHA-256 fingerprint on the app.',
      url,
    }
  }
  const expectedFps = app.android_sha256_fingerprint
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean)
  try {
    const doc = await fetchJson(url)
    const entries: AssetLinkEntry[] = Array.isArray(doc) ? doc : []
    const entry = entries.find(
      (e) =>
        e?.target?.namespace === 'android_app' &&
        e?.target?.package_name === app.android_package,
    )
    if (!entry) {
      return {
        status: 'missing',
        detail: `File is served, but package ${app.android_package} is not in it.`,
        url,
      }
    }
    const servedFps = (
      Array.isArray(entry.target?.sha256_cert_fingerprints)
        ? entry.target.sha256_cert_fingerprints
        : []
    )
      .filter((f): f is string => typeof f === 'string')
      .map((f) => f.toUpperCase())
    const missing = expectedFps.filter((f) => !servedFps.includes(f))
    if (servedFps.length > 0 && missing.length === 0) {
      return {
        status: 'verified',
        detail: `Package and ${servedFps.length} fingerprint(s) match.`,
        url,
      }
    }
    return {
      status: 'missing',
      detail: `Package is served, but ${missing.length} expected fingerprint(s) are absent.`,
      url,
    }
  } catch (e) {
    return { status: 'unreachable', detail: String(e), url }
  }
}

export async function runDomainCheck(app: App): Promise<DomainCheckResult> {
  const origin = originFor(app.domain)
  if (!origin) {
    const detail =
      'No domain configured — this app never appears in any well-known file.'
    return {
      origin: null,
      ios: { status: 'not_configured', detail, url: '' },
      android: { status: 'not_configured', detail, url: '' },
    }
  }
  const [ios, android] = await Promise.all([
    checkIos(app, origin),
    checkAndroid(app, origin),
  ])
  return { origin, ios, android }
}
