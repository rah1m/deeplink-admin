import { useState } from 'react'
import { Button, useToast } from '@shared/ui'
import { downloadFile, extractError } from '@shared/api'
import { formatNumber } from '@shared/lib'

// Mirrors the backend's csvExportLimit.
const CSV_EXPORT_LIMIT = 5000

/** The viewer's IANA zone, so exported timestamps read as the screen shows them. */
export function browserTimeZone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
}

function localDate() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface ExportCsvButtonProps {
  url: string
  /** The same filters the page's list query uses, minus pagination. */
  params: Record<string, unknown>
  /** Named like the backend's files: deeplink-<kind>-<date>.csv */
  kind: string
  /** Rows the current filters match, when the page already knows it. */
  total?: number
  noun?: string
}

export function ExportCsvButton({
  url,
  params,
  kind,
  total,
  noun = 'rows',
}: ExportCsvButtonProps) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    // Same refusal the backend would send, without the round trip.
    if (total != null && total > CSV_EXPORT_LIMIT) {
      toast.error(
        `Export covers at most ${formatNumber(CSV_EXPORT_LIMIT)} ${noun}; ${formatNumber(total)} match. Narrow the filters first.`,
      )
      return
    }
    setBusy(true)
    try {
      await downloadFile(
        url,
        { ...params, format: 'csv' },
        `deeplink-${kind}-${localDate()}.csv`,
      )
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" variant="secondary" loading={busy} onClick={onClick}>
      Export CSV
    </Button>
  )
}
