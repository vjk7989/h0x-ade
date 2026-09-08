import fs from 'node:fs'
import { PNG } from 'pngjs'
import { describe, expect, it } from 'vitest'

const black = PNG.sync.read(
  fs.readFileSync(new URL('../../../../resources/brand/h0x-mark-black.png', import.meta.url))
)
const white = PNG.sync.read(
  fs.readFileSync(new URL('../../../../resources/brand/h0x-mark-white.png', import.meta.url))
)

describe('h0x-ADE logo asset contract', () => {
  it('provides equal-size black and white marks for adaptive surfaces', () => {
    expect([black.width, black.height]).toEqual([1024, 1024])
    expect([white.width, white.height]).toEqual([1024, 1024])
    expect(black.data.length).toBe(white.data.length)
  })

  it('keeps both theme variants on the same transparent geometry', () => {
    let visiblePixels = 0
    let mismatch = false
    for (let index = 0; index < black.data.length; index += 4) {
      const alpha = black.data[index + 3]
      visiblePixels += alpha > 0 ? 1 : 0
      mismatch ||= alpha !== white.data[index + 3]
      mismatch ||= alpha > 0 && (black.data[index] !== 0 || white.data[index] !== 255)
    }
    expect(mismatch).toBe(false)
    expect(visiblePixels).toBeGreaterThan(0)
    expect(visiblePixels).toBeLessThan(black.width * black.height)
  })
})
