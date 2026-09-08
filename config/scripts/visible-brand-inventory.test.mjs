import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  auditBrandEntries,
  auditVisibleBrand,
  findBrandReason
} from './visible-brand-inventory.mjs'

describe('visible-brand inventory scanner', () => {
  it('detects standalone display identity and lowercase command examples', () => {
    expect(findBrandReason('Open Orca')).toBeDefined()
    expect(findBrandReason('Run ORCA status')).toBeDefined()
    expect(findBrandReason('Usage: orca terminal list')).toBeDefined()
    expect(findBrandReason('Usage: orca-ide serve')).toBeDefined()
    expect(findBrandReason('Usage: orca-dev status')).toBeDefined()
    expect(findBrandReason('h0x-ADE')).toBeUndefined()
    expect(findBrandReason('ORCA_BACKGROUND_LAUNCH')).toBeUndefined()
    expect(findBrandReason('orca-cli')).toBeUndefined()
  })

  it('requires exact, reasoned exemptions and rejects stale ones', () => {
    const entry = { path: 'src/example.ts', location: 'literal:1', text: 'Legacy Orca profile' }
    expect(
      auditBrandEntries(
        [entry],
        [{ path: entry.path, text: entry.text, reason: 'Names an imported legacy profile.' }]
      )
    ).toMatchObject({ violations: [], unusedExemptions: [] })

    const stale = auditBrandEntries(
      [],
      [{ path: entry.path, text: entry.text, reason: 'Names an imported legacy profile.' }]
    )
    expect(stale.unusedExemptions).toHaveLength(1)
    expect(() => auditBrandEntries([entry], [{ path: entry.path, text: entry.text }])).toThrow(
      'requires exact path, text, and reason'
    )
  })
})

describe('shipped visible-brand contract', () => {
  const repoRoot = path.resolve(import.meta.dirname, '..', '..')
  const result = auditVisibleBrand(repoRoot)

  it('scans a non-vacuous shipped display inventory', () => {
    expect(result.scannedFileCount).toBeGreaterThan(500)
  })

  it('contains no unapproved visible Orca identity or stale orca command example', () => {
    const summary = result.violations
      .slice(0, 50)
      .map(({ path: filePath, location, text }) => `${filePath} [${location}] ${text}`)
      .join('\n')
    expect(
      result.violations.length,
      `Replace app-owned display copy with h0x-ADE/h0x:\n${summary}`
    ).toBe(0)
  })

  it('contains no unused compatibility exemption', () => {
    expect(
      result.unusedExemptions,
      'Delete exemptions as soon as their exact legacy compatibility text leaves shipped surfaces.'
    ).toEqual([])
  })
})
