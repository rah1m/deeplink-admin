/// <reference types="node" />
// Run with `npm test` (node --test; Node 22.18+ strips the types itself).
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  desktopModePatch,
  desktopPageLacksStores,
  inheritDesktopLabel,
  isDesktopModeError,
  linkDesktopChoice,
} from './desktop-mode.ts'

describe('link form: desktop_mode', () => {
  test('inherit: a link on the app default preselects "" and sends nothing on PATCH', () => {
    // What GET returns for a link that follows an app set to app_page.
    const link = {
      desktop_mode: null,
      effective_desktop_mode: 'app_page',
      desktop_mode_source: 'app_default',
    }
    const initial = linkDesktopChoice(link)
    assert.equal(initial, '', 'never the effective mode — that would pin it')
    assert.equal(desktopModePatch(initial, ''), undefined)
  })

  test('custom: a link with its own value preselects it; changing it sends the new value', () => {
    const link = {
      desktop_mode: 'redirect',
      effective_desktop_mode: 'redirect',
      desktop_mode_source: 'custom',
    }
    const initial = linkDesktopChoice(link)
    assert.equal(initial, 'redirect')
    assert.equal(desktopModePatch(initial, 'redirect'), undefined)
    assert.equal(desktopModePatch(initial, 'app_page'), 'app_page')
  })

  test('inherit → custom → inherit round-trips through "" on PATCH', () => {
    // Save 1: follow the app → own choice.
    assert.equal(desktopModePatch('', 'app_page'), 'app_page')
    // Server now answers desktop_mode: "app_page", source custom.
    const afterCustom = linkDesktopChoice({
      desktop_mode: 'app_page',
      desktop_mode_source: 'custom',
    })
    assert.equal(afterCustom, 'app_page')
    // Save 2: back on the app — "" clears it, the server stores null.
    assert.equal(desktopModePatch(afterCustom, ''), '')
    assert.equal(
      linkDesktopChoice({ desktop_mode: null, desktop_mode_source: 'app_default' }),
      '',
    )
  })

  test('the inherit option is named after the selected app and follows an app change', () => {
    const bakcell = { desktop_mode: 'app_page' as const }
    const nar = { desktop_mode: 'redirect' as const }
    assert.equal(inheritDesktopLabel(bakcell), 'Brend default-u (Tətbiq səhifəsi göstər)')
    assert.equal(inheritDesktopLabel(nar), 'Brend default-u (Sayta yönləndir)')
    assert.equal(inheritDesktopLabel(undefined), 'Brend default-u', 'no app selected yet')
  })

  test('missing-stores hint only when the resulting mode is app_page and both stores are empty', () => {
    const noStores = { desktop_mode: 'app_page' as const }
    const withStore = { ...noStores, play_store_url: 'https://play.google.com/x' }
    const redirectApp = { desktop_mode: 'redirect' as const }
    assert.equal(desktopPageLacksStores('', noStores), true, 'inherited app_page')
    assert.equal(desktopPageLacksStores('redirect', noStores), false)
    assert.equal(desktopPageLacksStores('app_page', redirectApp), true, 'own app_page')
    assert.equal(desktopPageLacksStores('', withStore), false)
    assert.equal(desktopPageLacksStores('app_page', undefined), false, 'no app selected')
  })

  test('a desktop_mode 400 is recognised so it shows on the field', () => {
    assert.equal(isDesktopModeError('desktop_mode must be "redirect" or "app_page"'), true)
    assert.equal(isDesktopModeError('invalid default_fallback_url: bad scheme'), false)
  })
})
