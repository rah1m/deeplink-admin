import type { App, DesktopMode } from './types'

// SRE-0100: the app holds the default; a link follows it or sets its own,
// like default_fallback_url / fallback_url. Kept free of runtime imports so
// desktop-mode.test.ts runs under plain `node --test`.

export const DESKTOP_MODES: readonly DesktopMode[] = ['redirect', 'app_page']

/** Option labels in the app and link forms. */
export const desktopModeLabel: Record<DesktopMode, string> = {
  redirect: 'Sayta yönləndir',
  app_page: 'Tətbiq səhifəsi göstər',
}

/** Shorter labels for read-only views (link detail). */
export const desktopModeShortLabel: Record<DesktopMode, string> = {
  redirect: 'Sayta yönləndir',
  app_page: 'Tətbiq səhifəsi',
}

export function isDesktopMode(v: unknown): v is DesktopMode {
  return v === 'redirect' || v === 'app_page'
}

/** A link form's select value: "" follows the app. */
export type LinkDesktopChoice = DesktopMode | ''

/** Preselect for edit / clone. Reads the stored desktop_mode, never
 * effective_desktop_mode — that would pin today's app value into the link. */
export function linkDesktopChoice(link: {
  desktop_mode?: string | null
  desktop_mode_source?: string
}): LinkDesktopChoice {
  if (link.desktop_mode_source === 'app_default') return ''
  return isDesktopMode(link.desktop_mode) ? link.desktop_mode : ''
}

/** The "follow the app" option, naming what the app gives right now. */
export function inheritDesktopLabel(app?: Pick<App, 'desktop_mode'>): string {
  return isDesktopMode(app?.desktop_mode)
    ? `Brend default-u (${desktopModeLabel[app.desktop_mode]})`
    : 'Brend default-u'
}

/** What visitors get with this choice; undefined while it isn't known. */
export function resultingDesktopMode(
  choice: LinkDesktopChoice,
  app?: Pick<App, 'desktop_mode'>,
): DesktopMode | undefined {
  if (choice) return choice
  return isDesktopMode(app?.desktop_mode) ? app.desktop_mode : undefined
}

/** True when the app page would have no store buttons, only the QR code. */
export function desktopPageLacksStores(
  choice: LinkDesktopChoice,
  app?: Pick<App, 'desktop_mode' | 'app_store_url' | 'play_store_url'>,
): boolean {
  return (
    !!app &&
    resultingDesktopMode(choice, app) === 'app_page' &&
    !app.app_store_url &&
    !app.play_store_url
  )
}

/** PATCH value: the choice only when it changed, else undefined (omitted). */
export function desktopModePatch(
  initial: LinkDesktopChoice,
  next: LinkDesktopChoice | undefined,
): LinkDesktopChoice | undefined {
  return next === undefined || next === initial ? undefined : next
}

/** Whether a server error is about desktop_mode, so the form shows it on the
 * field: the backend answers `desktop_mode must be "redirect" or "app_page"`. */
export function isDesktopModeError(message: string): boolean {
  return message.includes('desktop_mode')
}
