// PATCH for the link's map fields (social_meta, utm_params, payload). The
// backend can't tell "cleared" from "untouched": an omitted field is left
// alone, and a sent map REPLACES the stored one whole (no merge). So the
// edit form compares with what GET returned and sends {} to clear, never
// null — payload would be stored as JSON null. Kept free of runtime imports
// so map-patch.test.ts runs under plain `node --test`.

export type JsonMap = Record<string, unknown>

function isMap(v: unknown): v is JsonMap {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** null, undefined or anything that isn't an object reads as {}. */
export function normalizeMap(v: unknown): JsonMap {
  return isMap(v) ? v : {}
}

/** The form's text fields as a map: keys left blank (after trim) dropped. */
export function compactStrings<K extends string>(
  fields: Partial<Record<K, string>>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  for (const k of Object.keys(fields) as K[]) {
    const v = fields[k]
    if (v !== undefined && v.trim() !== '') out[k] = v
  }
  return out
}

/** JSON with object keys sorted at every level, so key order doesn't count. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (isMap(v)) {
    const keys = Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`
  }
  return JSON.stringify(v) ?? 'null'
}

export function sameMap(a: unknown, b: unknown): boolean {
  return canonical(normalizeMap(a)) === canonical(normalizeMap(b))
}

/**
 * What to put in the PATCH body for one map field: undefined (omit) when it
 * didn't change, otherwise the full current map — {} when it was cleared.
 */
export function mapPatch<T extends object>(
  original: unknown,
  current: T | null | undefined,
): T | undefined {
  if (sameMap(original, current)) return undefined
  return (current ?? {}) as T
}

/** The keys the link form has fields for. */
export const SOCIAL_META_FORM_KEYS = ['title', 'description', 'image'] as const
export const UTM_FORM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const

/**
 * Adds back the original's keys the form has no field for (social_meta set
 * through the API can hold any key). A sent map replaces the stored one, so
 * without this an edit would drop data the user never saw.
 */
export function withHiddenKeys<T extends object>(
  original: unknown,
  current: T | undefined,
  shown: readonly string[],
): T | undefined {
  const hidden = Object.entries(normalizeMap(original)).filter(
    ([k]) => !shown.includes(k),
  )
  if (!hidden.length) return current
  return { ...Object.fromEntries(hidden), ...current } as T
}
