// The admin routes for one link take its numeric id (SRE-0118): a short code
// is unique per app only, so a code alone may name links of several brands.

/** A route param as a link id: a positive integer, else null. Never send
 * anything else — a code made only of digits would be read as the id of
 * another link. */
export function parseLinkId(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

/** What to tell the user when a call naming one link by id fails. Other
 * errors (a 400 on a field, say) keep the backend's message. */
export function linkErrorText(status: number | null, message: string): string {
  if (status === 400 && /invalid link id/i.test(message)) return 'Invalid link id'
  if (status === 403) return "You don't have access to this link's app"
  if (status === 404) return 'Link not found — it may have been deleted'
  return message
}

/** A 409 on create. Today "taken" means by any link of any app; from the
 * next release only by a live link of the same app — say neither. */
export const SHORT_CODE_TAKEN = 'This short code is already in use'
