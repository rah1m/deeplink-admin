/// <reference types="node" />
// Run with `npm test` (node --test; Node 22.18+ strips the types itself).
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { linkErrorText, parseLinkId } from './link-id.ts'

describe('parseLinkId', () => {
  test('a positive integer is an id', () => {
    assert.equal(parseLinkId('42'), 42)
  })

  test('a short code is not', () => {
    assert.equal(parseLinkId('affordable105mb'), null)
    assert.equal(parseLinkId('SUMMER26'), null)
  })

  test('zero, signs, padding and decimals are not', () => {
    for (const v of ['0', '-1', '+1', '007', '1.5', '1e3', ' 1', ''])
      assert.equal(parseLinkId(v), null, v)
    assert.equal(parseLinkId(undefined), null)
  })

  test('past the safe integer range is not', () => {
    assert.equal(parseLinkId('9007199254740993'), null)
  })
})

describe('linkErrorText', () => {
  test('400 invalid link id, 403 and 404 get their own text', () => {
    assert.equal(linkErrorText(400, 'invalid link id'), 'Invalid link id')
    assert.match(linkErrorText(403, 'no access to this app'), /access/)
    assert.match(linkErrorText(404, 'link not found'), /not found/)
  })

  test('any other error keeps the backend message', () => {
    assert.equal(
      linkErrorText(400, 'fallback_url must be http(s)'),
      'fallback_url must be http(s)',
    )
    assert.equal(linkErrorText(null, 'Network Error'), 'Network Error')
  })
})
