import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const workflow = parse(readFileSync('.github/workflows/pr.yml', 'utf8'))
const packagedCliSmoke = readFileSync('config/scripts/smoke-packaged-cli.mjs', 'utf8')

describe('packaged skills CLI PR gates', () => {
  it('builds and executes the Windows packaged CLI', () => {
    const job = workflow.jobs.package_windows
    const buildStep = job.steps.find((step) => step.name === 'Build package inputs')
    const prepareStep = job.steps.find((step) => step.name === 'Prepare Electron native runtime')
    const packageStep = job.steps.find((step) => step.name === 'Package unpacked app')
    const smokeStep = job.steps.find((step) => step.name === 'Smoke packaged CLI')

    expect(job['runs-on']).toBe('windows-2022')
    expect(buildStep.run).toBe('pnpm run build:release:parallel')
    expect(buildStep.env.ORCA_REUSE_WINDOWS_CLI_LAUNCHER).toBe('1')
    expect(prepareStep.run).toBe('node config/scripts/ensure-native-runtime.mjs --runtime=electron')
    expect(packageStep.run).toContain('electron-builder')
    expect(packageStep.run).toContain('--dir')
    expect(packageStep.env.ORCA_REUSE_PREPARED_NATIVE_RUNTIME).toBe('1')
    expect(smokeStep.run).toBe(
      'node config/scripts/smoke-packaged-cli.mjs --app-dir=dist/win-unpacked'
    )

    const aggregateStep = workflow.jobs.verify.steps.find(
      (step) => step.name === 'Require successful checks'
    )
    expect(aggregateStep.env.PACKAGE_WINDOWS).toBe('${{ needs.package_windows.result }}')
    expect(aggregateStep.run).toContain('"$PACKAGE_WINDOWS"')
  })

  it('selects only canonical packaged CLI launchers', () => {
    expect(packagedCliSmoke).toContain("return 'dist/mac-arm64/h0x-ADE.app'")
    expect(packagedCliSmoke).toContain(
      "return join(appDir, 'Contents', 'Resources', 'bin', 'h0x')"
    )
    expect(packagedCliSmoke).toContain("return join(appDir, 'resources', 'bin', 'h0x.exe')")
    expect(packagedCliSmoke).toContain("return join(appDir, 'resources', 'bin', 'h0x')")
    expect(packagedCliSmoke).not.toMatch(/return join\([^\n]+, 'bin', 'orca(?:\.exe)?'\)/)
  })
})
