import { useState } from 'react'
import { Button, useToast } from '@shared/ui'
import { downloadFile, extractError } from '@shared/api'
import { formatNumber } from '@shared/lib'
import './data-export.css'

// Mirrors the backend's exportLimit, which caps both formats.
const EXPORT_LIMIT = 5000

type ExportFormat = 'xlsx' | 'csv'

/** The viewer's IANA zone, so exported timestamps read as the screen shows them. */
export function browserTimeZone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
}

function localDate() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface ExportButtonsProps {
  url: string
  /** The same filters the page's list query uses, minus pagination. */
  params: Record<string, unknown>
  /** Named like the backend's files: deeplink-<kind>-<date>.<format> */
  kind: string
  /** Rows the current filters match, when the page already knows it. */
  total?: number
  noun?: string
}

/**
 * Excel gets a workbook: Excel splits a CSV on the region's list separator,
 * which is ";" in Azerbaijani and Russian locales, so a CSV opens in one
 * column there. The CSV stays for scripts and Google Sheets.
 */
export function ExportButtons({
  url,
  params,
  kind,
  total,
  noun = 'rows',
}: ExportButtonsProps) {
  const toast = useToast()
  const [busy, setBusy] = useState<ExportFormat | null>(null)

  const run = async (format: ExportFormat) => {
    // Same refusal the backend would send, without the round trip.
    if (total != null && total > EXPORT_LIMIT) {
      toast.error(
        `Export covers at most ${formatNumber(EXPORT_LIMIT)} ${noun}; ${formatNumber(total)} match. Narrow the filters first.`,
      )
      return
    }
    setBusy(format)
    try {
      await downloadFile(
        url,
        { ...params, format },
        `deeplink-${kind}-${localDate()}.${format}`,
      )
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="data-export">
      <span className="data-export__label">Export</span>
      <Button
        type="button"
        variant="secondary"
        loading={busy === 'xlsx'}
        disabled={busy !== null}
        title="Excel workbook (.xlsx)"
        onClick={() => run('xlsx')}
      >
        Excel
      </Button>
      <Button
        type="button"
        variant="ghost"
        loading={busy === 'csv'}
        disabled={busy !== null}
        title="CSV, for scripts and Google Sheets"
        onClick={() => run('csv')}
      >
        CSV
      </Button>
    </div>
  )
}
