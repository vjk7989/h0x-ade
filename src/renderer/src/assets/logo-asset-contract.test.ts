import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

const logo = fs.readFileSync(new URL('../../../../resources/logo.svg', import.meta.url), 'utf8')

describe('h0x-ADE logo asset contract', () => {
  it('is a square, accessible SVG with the canonical display name', () => {
    expect(logo).toMatch(/<svg\b[^>]*\bwidth="256"[^>]*\bheight="256"/)
    expect(logo).toMatch(/<svg\b[^>]*\bviewBox="0 0 256 256"/)
    expect(logo).toMatch(/<svg\b[^>]*\brole="img"/)
    expect(logo).toMatch(/<svg\b[^>]*\baria-label="h0x-ADE logo"/)
  })

  it('stays self-contained and free of active or externally loaded content', () => {
    expect(logo).not.toMatch(/<(?:script|foreignObject|iframe|image|use|a)\b/i)
    expect(logo).not.toMatch(/\bon[a-z]+\s*=/i)
    expect(logo).not.toMatch(/\b(?:href|src)\s*=/i)
    expect(logo).not.toMatch(/\burl\s*\(/i)
  })
})
