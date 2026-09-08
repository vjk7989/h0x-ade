import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import {
  inspectWindowsApp,
  parseUpdateManifest,
  verifyLinuxPackage,
  verifyUpdateManifest,
  writeAndVerifyChecksums
} from './verify-packaged-brand.mjs'

const roots = []
const fixture = () => {
  const root = mkdtempSync(join(process.cwd(), '.tmp-h0x-packaged-brand-'))
  roots.push(root)
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true })
  }
})

describe('packaged brand verifier', () => {
  it('parses canonical update manifest entries', () => {
    expect(
      parseUpdateManifest(
        'files:\n  - url: h0x-linux.AppImage\n    sha512: abc\n    size: 12\npath: h0x-linux.AppImage\n'
      )
    ).toEqual([
      { name: 'h0x-linux.AppImage', sha512: 'abc', size: 12 },
      { name: 'h0x-linux.AppImage' }
    ])
  })

  it('verifies manifest size and sha512', () => {
    const root = fixture()
    const artifact = join(root, 'h0x-windows-setup.exe')
    writeFileSync(artifact, 'canonical')
    const checksum = join(root, 'checksums.txt')
    writeAndVerifyChecksums([artifact], checksum)
    const sha512 = createHash('sha512').update('canonical').digest('base64')
    const manifest = join(root, 'latest.yml')
    writeFileSync(manifest, `path: h0x-windows-setup.exe\nsha512: ${sha512}\nsize: 9\n`)
    expect(() => verifyUpdateManifest(manifest, root, ['h0x-windows-setup.exe'])).not.toThrow()
    expect(readFileSync(checksum, 'utf8')).toMatch(/^[a-f0-9]{64}  h0x-windows-setup\.exe\n$/)
  })

  it('rejects a stale manifest digest', () => {
    const root = fixture()
    writeFileSync(join(root, 'h0x-linux.AppImage'), 'artifact')
    writeFileSync(
      join(root, 'latest-linux.yml'),
      'path: h0x-linux.AppImage\nsha512: stale\nsize: 8\n'
    )
    expect(() =>
      verifyUpdateManifest(join(root, 'latest-linux.yml'), root, ['h0x-linux.AppImage'])
    ).toThrow(/sha512/)
  })

  it('rejects an update manifest without hash metadata', () => {
    const root = fixture()
    writeFileSync(join(root, 'h0x-ADE-1.4.200-mac.zip'), 'artifact')
    writeFileSync(join(root, 'latest-mac.yml'), 'path: h0x-ADE-1.4.200-mac.zip\n')
    expect(() =>
      verifyUpdateManifest(join(root, 'latest-mac.yml'), root, ['h0x-ADE-1.4.200-mac.zip'])
    ).toThrow(/does not checksum/)
  })

  it('writes checksums in deterministic filename order', () => {
    const root = fixture()
    mkdirSync(join(root, 'nested'))
    writeFileSync(join(root, 'z.zip'), 'z')
    writeFileSync(join(root, 'nested', 'a.yml'), 'a')
    const output = join(root, 'checksums.txt')
    writeAndVerifyChecksums([join(root, 'z.zip'), join(root, 'nested', 'a.yml')], output)
    expect(
      readFileSync(output, 'utf8')
        .split('\n')
        .slice(0, 2)
        .map((line) => line.slice(66))
    ).toEqual(['a.yml', 'z.zip'])
  })

  it('gates every unsigned platform and uploads its checksum evidence', () => {
    const workflow = parse(readFileSync('.github/workflows/unsigned-desktop-build.yml', 'utf8'))
    const cases = [
      ['linux-x64', 'Verify packaged Linux branding and checksums', 'checksums-linux-x64.txt'],
      [
        'windows-x64',
        'Verify packaged Windows branding and checksums',
        'checksums-windows-x64.txt'
      ],
      [
        'macos',
        'Verify packaged macOS branding and checksums',
        'checksums-macos-${{ matrix.arch }}.txt'
      ]
    ]
    for (const [jobName, stepName, checksum] of cases) {
      const job = workflow.jobs[jobName]
      const step = job.steps.find((candidate) => candidate.name === stepName)
      const upload = job.steps.find((candidate) => candidate.name?.includes('Upload'))
      expect(step.run).toContain('verify-packaged-brand.mjs')
      expect(step.env.ORCA_BACKGROUND_LAUNCH).toBe('1')
      expect(upload.with.path).toContain(checksum)
    }
  })

  it('retains real AppImage signal and packaged CLI acceptance', () => {
    const workflow = parse(readFileSync('.github/workflows/unsigned-desktop-build.yml', 'utf8'))
    const commands = workflow.jobs['linux-x64'].steps.map((step) => step.run ?? '').join('\n')
    expect(commands).toContain('run-headless-serve-shutdown-docker.mjs')
    expect(commands).toContain('--entrypoint appimage')
    expect(commands).toContain('--signal-target serving-electron --int-delivery pid')
    expect(commands).toContain('run-linux-cli-launch-contract-docker.mjs')
    expect(commands).toContain('smoke-packaged-cli.mjs --app-dir=dist/linux-unpacked')
  })

  it('accepts only the canonical installed Linux desktop launcher', () => {
    const root = fixture()
    const appDir = join(root, 'app')
    const packageRoot = join(root, 'package')
    mkdirSync(join(appDir, 'resources', 'bin'), { recursive: true })
    writeFileSync(join(appDir, 'h0x'), 'launcher')
    writeFileSync(join(appDir, 'resources', 'bin', 'h0x'), 'cli')
    const applications = join(packageRoot, 'usr', 'share', 'applications')
    mkdirSync(applications, { recursive: true })
    for (const size of [16, 24, 32, 48, 64, 96, 128, 256, 512]) {
      const icons = join(packageRoot, 'usr', 'share', 'icons', 'hicolor', `${size}x${size}`, 'apps')
      mkdirSync(icons, { recursive: true })
      writeFileSync(join(icons, 'h0x.png'), 'icon')
    }
    const desktop = join(applications, 'h0x.desktop')
    const prefix = 'Name=h0x-ADE\nIcon=h0x\nStartupWMClass=h0x\n'
    writeFileSync(desktop, `${prefix}Exec=/opt/h0x-ADE/h0x %U\n`)
    expect(() => verifyLinuxPackage(appDir, packageRoot)).not.toThrow()
    for (const stale of ['Exec=h0x %U', 'Exec=/opt/Orca/orca-ide %U']) {
      writeFileSync(desktop, `${prefix}${stale}\n`)
      expect(() => verifyLinuxPackage(appDir, packageRoot)).toThrow(/does not launch h0x/)
    }
  })

  it('keeps the Windows inspector parseable and generates a standard macOS iconset', () => {
    const verifier = readFileSync('config/scripts/verify-packaged-brand.mjs', 'utf8')
    const builder = readFileSync('config/electron-builder.config.cjs', 'utf8')
    expect(verifier).toContain("].join('\\n')")
    expect(verifier).not.toContain("].join('; ')")
    expect(verifier).toContain('$bitmap.GetPixel($x,$y)')
    expect(verifier).not.toContain('$bitmap.Save(')
    expect(builder).toMatch(/win:\s*{[\s\S]*?icon: 'resources\/build\/icon\.ico'/)
    const generator = readFileSync('resources/icon-source/generate.sh', 'utf8')
    expect(generator).toContain('icon_512x512@2x.png')
    expect(generator).toContain('iconutil -c icns')
    expect(generator).not.toContain('xcrun actool')
  })

  it.runIf(process.platform === 'win32')(
    'transports Windows inspector paths outside PowerShell command text',
    () => {
      const result = inspectWindowsApp(
        join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
        join(process.cwd(), 'resources/build/linux-icons/32x32.png')
      )
      expect(result).toHaveProperty('ProductName')
      expect(result).toHaveProperty('FileDescription')
      expect(result).toHaveProperty('IconMatches')
    }
  )
})
