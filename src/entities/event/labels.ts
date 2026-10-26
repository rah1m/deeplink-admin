import type { ComponentProps } from 'react'
import type { Badge } from '@shared/ui'
import type { EventType } from './types'

// SRE-0115: how event types read in the panel. Kept free of runtime imports
// so labels.test.ts runs under plain `node --test`.

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>

/** The type filter's options, in this order. */
export const EVENT_TYPES: readonly EventType[] = [
  'click',
  'install',
  'open',
  'conversion',
  'preview',
  'dead_click',
]

const eventTypeTone: Record<EventType, BadgeTone> = {
  click: 'info',
  install: 'success',
  open: 'neutral',
  conversion: 'primary',
  preview: 'warning',
  dead_click: 'danger',
}

/** Badge and filter text: the API value, except dead_click, which reads as
 * two words. A type this panel doesn't know yet reads as its raw value. */
export function eventTypeText(type: string): string {
  return type === 'dead_click' ? 'dead click' : type
}

/** A type this panel doesn't know yet is neutral. */
export function eventTypeBadgeTone(type: string): BadgeTone {
  return Object.hasOwn(eventTypeTone, type)
    ? eventTypeTone[type as EventType]
    : 'neutral'
}

// Hover text for a type whose API value doesn't explain itself (wording
// pending marketing's approval).
const eventTypeHint: Partial<Record<EventType, string>> = {
  dead_click: 'Dayandırılmış linkə klik',
}

export function eventTypeHintText(type: string): string | undefined {
  return Object.hasOwn(eventTypeHint, type)
    ? eventTypeHint[type as EventType]
    : undefined
}

const deadClickReasonLabel: Record<string, string> = {
  inactive: 'Deaktiv',
  expired: 'Vaxtı bitib',
}

/** meta.reason of a dead_click, readable. An unknown reason reads as its raw
 * value; undefined when there is none. */
export function deadClickReasonText(reason: unknown): string | undefined {
  if (reason == null || reason === '') return undefined
  const text = String(reason)
  return Object.hasOwn(deadClickReasonLabel, text)
    ? deadClickReasonLabel[text]
    : text
}
