import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const script = readFileSync(new URL('./taskbar-brand-evidence.ps1', import.meta.url), 'utf8')
const workflow = readFileSync(
  new URL('../../../.github/workflows/win-update-e2e.yml', import.meta.url),
  'utf8'
)
const installerSteps = readFileSync(new URL('./installer-steps.mjs', import.meta.url), 'utf8')
const preflight = readFileSync(new URL('./preflight.mjs', import.meta.url), 'utf8')
const assertions = readFileSync(new URL('./assertions.mjs', import.meta.url), 'utf8')

describe('Windows taskbar brand acceptance', () => {
  it('is CI-only and asserts the exact taskbar name and generated icon', () => {
    expect(script).toContain("$env:GITHUB_ACTIONS -ne 'true'")
    expect(script).toContain("$_.Current.Name -eq 'h0x-ADE'")
    expect(script).toContain('[System.Drawing.Icon]::ExtractAssociatedIcon')
    expect(script).toContain('taskbar-hover-h0x-ADE.png')
  })

  it('upgrades v1.4.199 to the current ref and retains evidence', () => {
    expect(workflow).toContain("FROM_TAG: ${{ inputs.from_tag || 'v1.4.199' }}")
    expect(workflow).toContain('H0X_TASKBAR_BRAND_EVIDENCE_DIR: artifacts/diag/taskbar-brand')
    const runner = readFileSync(new URL('./run.mjs', import.meta.url), 'utf8')
    expect(runner).toContain("'taskbar-brand-evidence.ps1'")
    expect(workflow).toContain('artifacts/diag/**')
  })

  it('prefers canonical package identity and accepts the legacy executable only for upgrade discovery', () => {
    expect(installerSteps).toContain("const EXE_NAME = 'h0x-ADE.exe'")
    expect(installerSteps).toContain("const LEGACY_EXE_NAME = 'Orca.exe'")
    expect(installerSteps.indexOf('path.join(installDir, EXE_NAME)')).toBeLessThan(
      installerSteps.indexOf('path.join(installDir, LEGACY_EXE_NAME)')
    )
    expect(preflight).toContain("@('h0x-ADE.exe', 'Orca.exe')")
    expect(assertions).toContain("new Set(['h0x-ade', 'orca', 'electron'])")
  })
})
