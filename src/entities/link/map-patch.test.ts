/// <reference types="node" />
// Run with `npm test` (node --test; Node 22.18+ strips the types itself).
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  compactStrings,
  mapPatch,
  SOCIAL_META_FORM_KEYS,
  withHiddenKeys,
} from './map-patch.ts'

// The edit form's social_meta as it comes out of the three inputs.
const formSocial = (title = '', description = '', image = '') => {
  const m = compactStrings({ title, description, image })
  return Object.keys(m).length ? m : undefined
}

describe('link edit PATCH: social_meta / utm_params / payload', () => {
  test('unchanged: the field is omitted', () => {
    assert.equal(mapPatch({ title: 'VIP' }, formSocial('VIP')), undefined)
    // Key order and null/missing vs {} don't count as changes.
    assert.equal(
      mapPatch({ title: 'VIP', image: 'https://x/a.jpg' }, { image: 'https://x/a.jpg', title: 'VIP' }),
      undefined,
    )
    assert.equal(mapPatch(null, formSocial()), undefined)
    assert.equal(mapPatch(undefined, {}), undefined)
  })

  test('cleared: every field emptied sends {}', () => {
    const original = { title: 'VIP', image: 'https://x/a.jpg' }
    assert.deepEqual(mapPatch(original, formSocial('', '', '')), {})
    // Whitespace-only counts as empty.
    assert.deepEqual(mapPatch(original, formSocial('  ', '', ' ')), {})
  })

  test('partial: clearing one key sends the full remaining map, not a diff', () => {
    const original = { title: 'VIP', description: 'Text' }
    assert.deepEqual(mapPatch(original, formSocial('', 'Text')), { description: 'Text' })
    const utm = { utm_source: 'sms', utm_campaign: 'yay26' }
    assert.deepEqual(mapPatch(utm, { utm_campaign: 'yay26' }), { utm_campaign: 'yay26' })
  })

  test('payload cleared sends {}, and a nested change sends the whole object', () => {
    assert.deepEqual(mapPatch({ screen: 'spin-game' }, undefined), {})
    assert.equal(
      mapPatch({ screen: 'spin-game', meta: { a: 1, b: [1, 2] } }, { meta: { b: [1, 2], a: 1 }, screen: 'spin-game' }),
      undefined,
    )
    assert.deepEqual(
      mapPatch({ screen: 'spin-game', meta: { a: 1 } }, { screen: 'spin-game', meta: { a: 2 } }),
      { screen: 'spin-game', meta: { a: 2 } },
    )
  })

  test('never null: a null current value reads as cleared', () => {
    assert.deepEqual(mapPatch({ title: 'VIP' }, null), {})
    assert.equal(mapPatch(null, null), undefined)
  })

  test('keys the form has no field for survive a save', () => {
    const original = { title: 'VIP', site_name: 'Bakcell' }
    const current = withHiddenKeys(original, formSocial(''), SOCIAL_META_FORM_KEYS)
    assert.deepEqual(mapPatch(original, current), { site_name: 'Bakcell' })
    // Untouched form: nothing to send even though site_name isn't shown.
    const untouched = withHiddenKeys(original, formSocial('VIP'), SOCIAL_META_FORM_KEYS)
    assert.equal(mapPatch(original, untouched), undefined)
  })
})
