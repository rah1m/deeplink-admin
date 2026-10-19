export { ExportButtons } from './ui'

/** The viewer's IANA zone, so exported timestamps read as the screen shows them. */
export function browserTimeZone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
}
