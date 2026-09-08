#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const PRODUCT = 'h0x-ADE'
const CLI = 'h0x'
const APP_ID = 'tech.pavii.h0xade'
const SOURCE_ICON = resolve('resources/build/icon.png')
const SOURCE_ICNS = resolve('resources/build/icon.icns')

function fail(message) {
  throw new Error(`packaged-brand: ${message}`)
}

function requireFile(path, label = path) {
  if (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0) {
    fail(`missing or empty ${label}: ${path}`)
  }
}

function digest(path, algorithm, encoding = 'hex') {
  return createHash(algorithm).update(readFileSync(path)).digest(encoding)
}

export function parseUpdateManifest(text) {
  const entries = []
  let current = null
  for (const line of text.split(/\r?\n/)) {
    const pathMatch = line.match(/^\s*(?:-\s*)?(?:url|path):\s*['"]?([^'"\s]+)['"]?\s*$/)
    if (pathMatch) {
      current = { name: basename(pathMatch[1]) }
      entries.push(current)
      continue
    }
    const hashMatch = line.match(/^\s*sha512:\s*['"]?([^'"\s]+)['"]?\s*$/)
    if (hashMatch && current) {
      current.sha512 = hashMatch[1]
    }
    const sizeMatch = line.match(/^\s*size:\s*(\d+)\s*$/)
    if (sizeMatch && current) {
      current.size = Number(sizeMatch[1])
    }
  }
  return entries
}

export function verifyUpdateManifest(manifestPath, distDir, expectedNames) {
  requireFile(manifestPath, 'update manifest')
  const entries = parseUpdateManifest(readFileSync(manifestPath, 'utf8'))
  for (const expectedName of expectedNames) {
    const entry = entries.find((candidate) => candidate.name === expectedName)
    if (!entry) {
      fail(`${basename(manifestPath)} does not reference ${expectedName}`)
    }
    if (!entry.sha512 || entry.size === undefined) {
      fail(`${basename(manifestPath)} does not checksum ${expectedName}`)
    }
    const artifactPath = join(distDir, expectedName)
    requireFile(artifactPath, 'manifest artifact')
    if (entry.size !== statSync(artifactPath).size) {
      fail(`${expectedName} size does not match ${basename(manifestPath)}`)
    }
    if (entry.sha512 !== digest(artifactPath, 'sha512', 'base64')) {
      fail(`${expectedName} sha512 does not match ${basename(manifestPath)}`)
    }
  }
}

export function writeAndVerifyChecksums(paths, outputPath) {
  const sorted = [...paths]
    .map((path) => resolve(path))
    .sort((a, b) => basename(a).localeCompare(basename(b)))
  for (const path of sorted) {
    requireFile(path, 'checksum input')
  }
  const content = `${sorted
    .map((path) => `${digest(path, 'sha256')}  ${basename(path)}`)
    .join('\n')}\n`
  writeFileSync(outputPath, content, 'utf8')
  for (const line of readFileSync(outputPath, 'utf8').trimEnd().split('\n')) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/)
    if (!match) {
      fail(`invalid checksum line in ${outputPath}`)
    }
    const path = sorted.find((candidate) => basename(candidate) === match[2])
    if (!path || digest(path, 'sha256') !== match[1]) {
      fail(`invalid checksum for ${match[2]}`)
    }
  }
}

function plistValue(text, key) {
  return text.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`))?.[1]
}

export function verifyMacApp(appDir) {
  const contents = join(appDir, 'Contents')
  const plistPath = join(contents, 'Info.plist')
  requireFile(plistPath)
  const plist = readFileSync(plistPath, 'utf8')
  const expected = {
    CFBundleDisplayName: PRODUCT,
    CFBundleName: PRODUCT,
    CFBundleExecutable: PRODUCT,
    CFBundleIdentifier: APP_ID
  }
  for (const [key, value] of Object.entries(expected)) {
    if (plistValue(plist, key) !== value) {
      fail(`macOS ${key} must be ${value}`)
    }
  }
  requireFile(join(contents, 'MacOS', PRODUCT), 'macOS launcher')
  requireFile(join(contents, 'Resources', 'bin', CLI), 'macOS CLI')
  const packagedIcon = join(contents, 'Resources', 'icon.icns')
  requireFile(packagedIcon, 'macOS icon')
  if (digest(packagedIcon, 'sha256') !== digest(SOURCE_ICNS, 'sha256')) {
    fail('macOS icon does not match the generated canonical ICNS')
  }
  for (const name of ['h0x-menu-barTemplate.png', 'h0x-menu-barTemplate@2x.png']) {
    requireFile(resolve('resources/tray', name), `generated menu template ${name}`)
  }
  // The helper name is a deliberate TCC compatibility identity; it is not the product display name.
  requireFile(join(contents, 'Resources', 'Orca Computer Use.app', 'Contents', 'Info.plist'))
}

export function verifyLinuxPackage(appDir, packageRoot) {
  requireFile(join(appDir, CLI), 'Linux launcher')
  requireFile(join(appDir, 'resources', 'bin', CLI), 'Linux CLI')
  if (!packageRoot) {
    return
  }
  const desktopPath = join(packageRoot, 'usr', 'share', 'applications', 'h0x.desktop')
  requireFile(desktopPath, 'Linux desktop entry')
  const desktop = readFileSync(desktopPath, 'utf8')
  for (const line of ['Name=h0x-ADE', 'Icon=h0x', 'StartupWMClass=h0x']) {
    if (!desktop.split(/\r?\n/).includes(line)) {
      fail(`Linux desktop entry is missing ${line}`)
    }
  }
  if (!desktop.split(/\r?\n/).includes('Exec=/opt/h0x-ADE/h0x %U')) {
    fail('Linux desktop entry does not launch h0x')
  }
  for (const size of [16, 24, 32, 48, 64, 96, 128, 256, 512]) {
    requireFile(
      join(packageRoot, 'usr', 'share', 'icons', 'hicolor', `${size}x${size}`, 'apps', 'h0x.png'),
      `Linux ${size}px icon`
    )
  }
}

export function inspectWindowsApp(exePath, iconPath) {
  const script = [
    'Add-Type -AssemblyName System.Drawing',
    'function Get-BitmapHash($bitmap) {',
    '  $pixels=[byte[]]::new($bitmap.Width*$bitmap.Height*4); $offset=0',
    '  for ($y=0; $y -lt $bitmap.Height; $y++) { for ($x=0; $x -lt $bitmap.Width; $x++) {',
    '    $pixel=$bitmap.GetPixel($x,$y)',
    '    $pixels[$offset]=$pixel.B; $pixels[$offset+1]=$pixel.G; $pixels[$offset+2]=$pixel.R; $pixels[$offset+3]=$pixel.A; $offset+=4',
    '  } }',
    '  $sha=[Security.Cryptography.SHA256]::Create()',
    '  try { return "$($bitmap.Width)x$($bitmap.Height):$([Convert]::ToBase64String($sha.ComputeHash($pixels)))" }',
    '  finally { $sha.Dispose(); $bitmap.Dispose() }',
    '}',
    '$v=(Get-Item -LiteralPath $env:H0X_PACKAGED_EXE_PATH).VersionInfo',
    '$icon=[Drawing.Icon]::ExtractAssociatedIcon($env:H0X_PACKAGED_EXE_PATH)',
    '$embedded=Get-BitmapHash ($icon.ToBitmap()); $icon.Dispose()',
    '$canonical=Get-BitmapHash ([Drawing.Bitmap]::new($env:H0X_CANONICAL_ICON_PATH))',
    '@{ProductName=$v.ProductName;FileDescription=$v.FileDescription;IconMatches=($embedded -eq $canonical)}|ConvertTo-Json -Compress'
  ].join('\n')
  return JSON.parse(
    execFileSync('powershell.exe', ['-NoProfile', '-Command', script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        H0X_PACKAGED_EXE_PATH: exePath,
        H0X_CANONICAL_ICON_PATH: iconPath
      }
    })
  )
}

export function verifyWindowsApp(appDir) {
  const exePath = join(appDir, `${PRODUCT}.exe`)
  requireFile(exePath, 'Windows launcher')
  requireFile(join(appDir, 'resources', 'bin', `${CLI}.exe`), 'Windows CLI')
  const iconPath = resolve('resources/build/linux-icons/32x32.png')
  requireFile(iconPath, 'generated canonical Windows icon frame')
  requireFile(SOURCE_ICON, 'canonical Windows tile source')
  if (process.platform !== 'win32') {
    return
  }
  const version = inspectWindowsApp(exePath, iconPath)
  if (version.ProductName !== PRODUCT || version.FileDescription !== PRODUCT) {
    fail(`Windows VersionInfo must identify ${PRODUCT}`)
  }
  if (!version.IconMatches) {
    fail('Windows executable icon does not match the generated canonical ICO')
  }
}

export function verifyPackagedBrand({ platform, arch, appDir, distDir, packageRoot }) {
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version
  const platformContracts = {
    linux: {
      artifacts: [`h0x_${version}_amd64.deb`, `h0x-${version}.x86_64.rpm`, 'h0x-linux.AppImage'],
      manifest: 'latest-linux.yml'
    },
    windows: { artifacts: ['h0x-windows-setup.exe'], manifest: 'latest.yml' },
    macos: {
      artifacts: [
        `h0x-macos-${arch}.dmg`,
        arch === 'arm64' ? `h0x-ADE-${version}-arm64-mac.zip` : `h0x-ADE-${version}-mac.zip`
      ],
      manifest: 'latest-mac.yml'
    }
  }
  const contract = platformContracts[platform]
  if (!contract) {
    fail(`unsupported platform ${platform}`)
  }
  for (const name of contract.artifacts) {
    requireFile(join(distDir, name), `${platform} artifact`)
  }
  verifyUpdateManifest(join(distDir, contract.manifest), distDir, contract.artifacts.slice(-1))
  if (platform === 'linux') {
    verifyLinuxPackage(appDir, packageRoot)
  }
  if (platform === 'windows') {
    verifyWindowsApp(appDir)
  }
  if (platform === 'macos') {
    verifyMacApp(appDir)
  }
  const checksumPath = join(distDir, `checksums-${platform}-${arch}.txt`)
  writeAndVerifyChecksums(
    [...contract.artifacts.map((name) => join(distDir, name)), join(distDir, contract.manifest)],
    checksumPath
  )
  return checksumPath
}

function readArgs(argv) {
  return Object.fromEntries(argv.map((arg) => arg.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)))
}

function main() {
  const args = readArgs(process.argv.slice(2))
  const checksumPath = verifyPackagedBrand({
    platform: args.platform,
    arch: args.arch || 'x64',
    appDir: resolve(args['app-dir'] || ''),
    distDir: resolve(args['dist-dir'] || 'dist'),
    packageRoot: args['package-root'] ? resolve(args['package-root']) : undefined
  })
  console.log(`Verified packaged ${PRODUCT} branding; checksums: ${checksumPath}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
