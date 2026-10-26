/// <reference types="node" />
// Run with `npm test` (node --test; Node 22.18+ strips the types itself).
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  EVENT_TYPES,
  deadClickReasonText,
  eventTypeBadgeTone,
  eventTypeHintText,
  eventTypeText,
} from './labels.ts'

describe('event type labels', () => {
  test('the type filter offers preview and dead_click', () => {
    assert.ok(EVENT_TYPES.includes('dead_click'))
    assert.ok(EVENT_TYPES.includes('preview'))
  })

  test('dead_click reads as "dead click", the rest as the API value', () => {
    assert.equal(eventTypeText('dead_click'), 'dead click')
    assert.equal(eventTypeText('preview'), 'preview')
    assert.equal(eventTypeText('refund'), 'refund')
  })

  test('dead_click has a hover text, the self-explaining types none', () => {
    assert.equal(eventTypeHintText('dead_click'), 'Dayandırılmış linkə klik')
    assert.equal(eventTypeHintText('click'), undefined)
  })

  test('a type the panel does not know gets a neutral badge and no hint', () => {
    assert.equal(eventTypeBadgeTone('refund'), 'neutral')
    assert.equal(eventTypeBadgeTone('dead_click'), 'danger')
    // Not an own key, so not a hint either.
    assert.equal(eventTypeHintText('toString'), undefined)
  })

  test('dead_click reason', () => {
    assert.equal(deadClickReasonText('inactive'), 'Deaktiv')
    assert.equal(deadClickReasonText('expired'), 'Vaxtı bitib')
    assert.equal(deadClickReasonText('paused'), 'paused')
    assert.equal(deadClickReasonText(undefined), undefined)
    assert.equal(deadClickReasonText(''), undefined)
  })
})
