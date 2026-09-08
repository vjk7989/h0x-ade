import { describe, expect, it } from 'vitest'
import { APP_ICON_OPTIONS, DEFAULT_APP_ICON_ID, normalizeAppIconId } from './app-icon'

describe('h0x-ADE app icon migration contract', () => {
  it('offers only the canonical h0x-ADE icon on new selections', () => {
    expect(APP_ICON_OPTIONS).toEqual([{ id: 'classic', label: 'h0x-ADE' }])
    expect(DEFAULT_APP_ICON_ID).toBe('classic')
  })

  it.each(['watercolor', 'blue'])(
    'migrates the legacy %s icon value to the canonical icon',
    (id) => {
      expect(normalizeAppIconId(id)).toBe('classic')
    }
  )

  it.each([undefined, null, '', 'missing', 1])(
    'defaults malformed value %j to the canonical icon',
    (value) => {
      expect(normalizeAppIconId(value)).toBe('classic')
    }
  )
})
