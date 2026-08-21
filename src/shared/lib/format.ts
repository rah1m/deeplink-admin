export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null) return '0'
  return new Intl.NumberFormat('en-US').format(n)
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const total = Math.round(seconds)
  if (total < 60) return `${total}s`
  const units: Array<[number, string]> = [
    [86400, 'd'],
    [3600, 'h'],
    [60, 'm'],
    [1, 's'],
  ]
  const parts: string[] = []
  let rest = total
  for (const [size, label] of units) {
    const n = Math.floor(rest / size)
    rest %= size
    if (n > 0) parts.push(`${n}${label}`)
    if (parts.length === 2) break
  }
  return parts.join(' ')
}
