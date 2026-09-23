/** Mirrors the backend's fallback URL rule: http(s) with a host. */
export function httpUrlError(value: string): string | undefined {
  try {
    const u = new URL(value)
    if ((u.protocol === 'http:' || u.protocol === 'https:') && u.host) {
      return undefined
    }
  } catch {
    // unparseable — same answer as a wrong scheme
  }
  return 'Must be an http(s) URL with a host, e.g. https://example.com'
}
