import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

const shellDocuments = [
  ['desktop', '../../index.html', 'h0x-ADE'],
  ['web', '../../web-index.html', 'h0x-ADE Web'],
  ['agent dashboard', '../../popout.html', 'h0x-ADE Agent Dashboard']
] as const

describe('h0x-ADE shell document title contract', () => {
  it.each(shellDocuments)(
    '%s shell uses the display brand in its document title',
    (_, path, title) => {
      const html = fs.readFileSync(new URL(path, import.meta.url), 'utf8')

      expect(html).toMatch(new RegExp(`<title>\\s*${title}\\s*</title>`))
      expect(html.match(/<title>[\s\S]*?<\/title>/i)?.[0]).not.toMatch(/\bOrca\b/i)
    }
  )
})
