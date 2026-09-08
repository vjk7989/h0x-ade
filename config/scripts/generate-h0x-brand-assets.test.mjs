import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PNG } from 'pngjs'
import {
  generateBrandAssetBuffers,
  LINUX_ICON_SIZES,
  SOURCE_SHA256,
  SOURCE_SIZE,
  syncBrandAssets
} from './generate-h0x-brand-assets.mjs'

const repoRoot = dirname(dirname(import.meta.dirname))
const source = readFileSync(join(repoRoot, 'resources/brand/h0x-mark-source.png'))

describe('h0x brand asset generator', () => {
  it('pins the authoritative source and reproduces every committed output', () => {
    expect(createHash('sha256').update(source).digest('hex').toUpperCase()).toBe(SOURCE_SHA256)
    expect(() => syncBrandAssets({ check: true })).not.toThrow()
  })

  it('emits theme-adaptive marks with identical geometry', () => {
    const generated = generateBrandAssetBuffers(source)
    const black = PNG.sync.read(generated.get('resources/brand/h0x-mark-black.png'))
    const white = PNG.sync.read(generated.get('resources/brand/h0x-mark-white.png'))

    expect([black.width, black.height]).toEqual([1024, 1024])
    expect([white.width, white.height]).toEqual([1024, 1024])
    let mismatch = false
    for (let index = 0; index < black.data.length; index += 4) {
      mismatch ||= black.data[index + 3] !== white.data[index + 3]
      mismatch ||=
        black.data[index + 3] > 0 && (black.data[index] !== 0 || white.data[index] !== 255)
    }
    expect(mismatch).toBe(false)
  })

  it('keeps required platform sizes and removes legacy visual assets', () => {
    const generated = generateBrandAssetBuffers(source)
    const dimensions = [
      ['resources/build/icon.png', 1024, 1024],
      ['resources/icon.png', 256, 256],
      ['resources/tray/h0x-menu-barTemplate.png', 22, 14],
      ['resources/tray/h0x-menu-barTemplate@2x.png', 44, 28],
      ['mobile/assets/icon.png', 1024, 1024],
      ['mobile/assets/adaptive-icon.png', 1024, 1024],
      ['mobile/assets/splash-icon.png', 400, 400],
      ['mobile/assets/favicon.png', 48, 48]
    ]
    for (const [path, width, height] of dimensions) {
      const image = PNG.sync.read(generated.get(path))
      expect([image.width, image.height], path).toEqual([width, height])
    }
    expect(PNG.sync.read(source).width).toBe(SOURCE_SIZE)
    expect(existsSync(join(repoRoot, 'resources/app-icons/orca-blue.png'))).toBe(false)
    expect(existsSync(join(repoRoot, 'resources/app-icons/orca-watercolor.png'))).toBe(false)
    expect(existsSync(join(repoRoot, 'resources/logo.svg'))).toBe(false)
  })

  it('emits the complete Windows ICO frame set', () => {
    const ico = generateBrandAssetBuffers(source).get('resources/build/icon.ico')
    expect(ico.readUInt16LE(2)).toBe(1)
    expect(ico.readUInt16LE(4)).toBe(6)
    const widths = Array.from({ length: 6 }, (_, index) => ico.readUInt8(6 + index * 16) || 256)
    expect(widths).toEqual([256, 128, 64, 48, 32, 16])
  })

  it('emits the complete pre-sized Linux icon set', () => {
    const generated = generateBrandAssetBuffers(source)
    for (const size of LINUX_ICON_SIZES) {
      const path = `resources/build/linux-icons/${size}x${size}.png`
      const image = PNG.sync.read(generated.get(path))
      expect([image.width, image.height], path).toEqual([size, size])
    }
  })
})
