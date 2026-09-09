#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'

const EXPECTED_ASSET_HASHES = {
  icon: '905715fc7303915ce1e809ad59e74e758c4017e2df53875158a6d9e22d3cfc80',
  adaptiveIcon: '4fad8111566c73177994ffe91605b62fae52f095942e39a0f503119a94c68409',
  splash: '8a5cb6b7b93d27c9b0a0b677e8dfd77ca8fbfb7edd98104fc94bdb9b6629a64b'
}

function fail(message) {
  throw new Error(message)
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function assertEqual(actual, expected, label) {
  if (String(actual ?? '') !== String(expected)) {
    fail(`${label} must be ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`)
  }
}

function assertNoLegacyBrand(values) {
  for (const [label, value] of Object.entries(values)) {
    if (/orca/i.test(String(value ?? ''))) {
      fail(`${label} contains legacy Orca branding`)
    }
  }
}

export function expectedArtifactName(platform, version) {
  return `h0x-ade-mobile-${version}-${platform === 'android' ? 'android.apk' : 'ios-simulator.zip'}`
}

export function checksumLine(checksum, artifactName) {
  if (!/^[a-f0-9]{64}$/.test(checksum)) {
    fail('SHA-256 checksum must contain 64 lowercase hex characters')
  }
  return `${checksum}  ${artifactName}\n`
}

export function verifyUnsignedApkResult(result) {
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  if (result.status === 0) {
    fail('Android APK is signed')
  }
  if (
    result.error ||
    !/DOES NOT VERIFY/i.test(output) ||
    /Signer certificate|certificate DN|certificate SHA-256 digest/i.test(output)
  ) {
    fail(`Unable to prove Android APK is unsigned: ${output.trim() || result.error?.message}`)
  }
}

export function verifySourceConfig(config, mobileRoot) {
  const expo = config.expo ?? fail('app config is missing expo')
  assertEqual(expo.name, 'h0x-ADE Mobile', 'app name')
  assertEqual(expo.version, '0.0.48', 'app version')
  assertEqual(expo.slug, 'h0x-mobile', 'app slug')
  assertEqual(expo.scheme, 'pavii-h0x', 'packaged URL scheme')
  assertEqual(expo.android?.package, 'tech.pavii.h0xade.mobile', 'Android package')
  assertEqual(expo.ios?.bundleIdentifier, 'tech.pavii.h0xade.mobile', 'iOS bundle identifier')
  const assets = {
    icon: expo.icon,
    adaptiveIcon: expo.android?.adaptiveIcon?.foregroundImage,
    splash: expo.splash?.image
  }
  for (const [name, relative] of Object.entries(assets)) {
    if (!relative) {
      fail(`${name} asset path is missing`)
    }
    assertEqual(
      sha256(path.resolve(mobileRoot, relative)),
      EXPECTED_ASSET_HASHES[name],
      `${name} hash`
    )
  }
  assertNoLegacyBrand({
    name: expo.name,
    localNetworkPermission: expo.ios?.infoPlist?.NSLocalNetworkUsageDescription,
    microphonePermission: expo.ios?.infoPlist?.NSMicrophoneUsageDescription,
    photoPermission: expo.ios?.infoPlist?.NSPhotoLibraryUsageDescription
  })
  return expo
}

function verifyPackagedSchemes(csv, expo, platformIdentifier, label) {
  const schemes = String(csv ?? '')
    .split(',')
    .filter(Boolean)
  if (!schemes.includes(expo.scheme)) {
    fail(`${label} must include canonical scheme ${JSON.stringify(expo.scheme)}`)
  }
  const allowed = new Set([expo.scheme, `exp+${expo.slug}`, platformIdentifier])
  const unexpected = schemes.filter((scheme) => !allowed.has(scheme))
  if (unexpected.length) {
    fail(`${label} contains unexpected schemes: ${unexpected.join(',')}`)
  }
}

export function verifyAndroidInspection(inspection, expo) {
  assertEqual(inspection.package, expo.android.package, 'Android package')
  assertEqual(inspection.versionName, expo.version, 'Android version')
  assertEqual(inspection.label, expo.name, 'Android label')
  verifyPackagedSchemes(
    inspection.schemes,
    expo,
    expo.android.package,
    'Android packaged URL schemes'
  )
  if (!inspection.iconEntries?.length) {
    fail('Android artifact is missing packaged icon resources')
  }
  assertNoLegacyBrand({
    label: inspection.label,
    cameraPermission: inspection.permissionDescriptions?.camera,
    microphonePermission: inspection.permissionDescriptions?.microphone,
    photosPermission: inspection.permissionDescriptions?.photos
  })
}

export function verifyIosInspection(inspection, expo) {
  assertEqual(inspection.bundleIdentifier, expo.ios.bundleIdentifier, 'iOS bundle identifier')
  assertEqual(inspection.version, expo.version, 'iOS version')
  assertEqual(inspection.displayName, expo.name, 'iOS display name')
  verifyPackagedSchemes(
    inspection.schemes,
    expo,
    expo.ios.bundleIdentifier,
    'iOS packaged URL schemes'
  )
  if (!inspection.hasMachOExecutable) {
    fail('iOS artifact is missing its Mach-O executable')
  }
  if (!inspection.hasAssetCatalog) {
    fail('iOS artifact is missing Assets.car')
  }
  assertNoLegacyBrand({ displayName: inspection.displayName, ...inspection.permissionDescriptions })
}

function parseAndroidBadging(text) {
  const value = (pattern, label) =>
    pattern.exec(text)?.[1] ?? fail(`aapt output is missing ${label}`)
  return {
    package: value(/package: name='([^']+)'/, 'package'),
    versionName: value(/versionName='([^']+)'/, 'versionName'),
    label: value(/application-label(?:-[^:]+)?:'([^']+)'/, 'application label')
  }
}

export function parseAndroidIconEntries(text, packagedEntries) {
  const packaged = new Set(packagedEntries)
  const icons = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('application-icon-')) {
      continue
    }
    const path = /^application-icon-[0-9]+:'([^']+)'$/.exec(line)?.[1]
    if (!path || !/^res\/(?:mipmap|drawable)[^/]*\/[^/]+\.(?:png|webp|xml)$/i.test(path)) {
      fail(`Android badging contains invalid launcher icon entry: ${line}`)
    }
    if (!packaged.has(path)) {
      fail(`Android launcher icon is absent from APK: ${path}`)
    }
    icons.push(path)
  }
  return [...new Set(icons)].sort()
}

export function parseAndroidManifestSchemes(text) {
  const manifest = text.replace(/<!--[\s\S]*?-->/g, '')
  return [...manifest.matchAll(/<intent-filter(?=\s|>)[^>]*>([\s\S]*?)<\/intent-filter\s*>/g)]
    .flatMap((match) => [...match[1].matchAll(/<data(?=\s|\/?>)[^>]*>/gs)])
    .flatMap(([tag]) => {
      const value = /\sandroid:scheme\s*=\s*(["'])([^"'&<>]+)\1/.exec(tag)?.[2]
      return value ? [value] : []
    })
}

function inspectAndroid(artifact) {
  const aapt = process.env.AAPT2 || process.env.AAPT || 'aapt2'
  const apkanalyzer = process.env.APKANALYZER || 'apkanalyzer'
  const badging = execFileSync(aapt, ['dump', 'badging', artifact], { encoding: 'utf8' })
  const manifest = execFileSync(apkanalyzer, ['manifest', 'print', artifact], { encoding: 'utf8' })
  const entries = execFileSync('unzip', ['-Z1', artifact], { encoding: 'utf8' }).split(/\r?\n/)
  const apksigner = process.env.APKSIGNER || 'apksigner'
  verifyUnsignedApkResult(
    spawnSync(apksigner, ['verify', '--verbose', '--print-certs', artifact], {
      encoding: 'utf8'
    })
  )
  const schemes = parseAndroidManifestSchemes(manifest)
  return {
    ...parseAndroidBadging(badging),
    schemes: [...new Set(schemes)].sort().join(','),
    iconEntries: parseAndroidIconEntries(badging, entries),
    permissionDescriptions: {}
  }
}

function inspectIos(appDir) {
  const plist = JSON.parse(
    execFileSync('plutil', ['-convert', 'json', '-o', '-', path.join(appDir, 'Info.plist')], {
      encoding: 'utf8'
    })
  )
  const executable = path.join(appDir, plist.CFBundleExecutable ?? '')
  const fileDescription = existsSync(executable)
    ? execFileSync('file', ['-b', executable], { encoding: 'utf8' })
    : ''
  const schemes = (plist.CFBundleURLTypes ?? []).flatMap((entry) => entry.CFBundleURLSchemes ?? [])
  return {
    bundleIdentifier: plist.CFBundleIdentifier,
    version: plist.CFBundleShortVersionString,
    displayName: plist.CFBundleDisplayName ?? plist.CFBundleName,
    schemes: [...new Set(schemes)].sort().join(','),
    permissionDescriptions: {
      localNetwork: plist.NSLocalNetworkUsageDescription,
      microphone: plist.NSMicrophoneUsageDescription,
      photos: plist.NSPhotoLibraryUsageDescription,
      camera: plist.NSCameraUsageDescription
    },
    hasMachOExecutable: /Mach-O/.test(fileDescription),
    hasAssetCatalog: existsSync(path.join(appDir, 'Assets.car'))
  }
}

function inspectIosZip(artifact) {
  const extractionRoot = mkdtempSync(path.join(tmpdir(), 'h0x-ios-artifact-'))
  try {
    execFileSync('ditto', ['-x', '-k', artifact, extractionRoot])
    const appName = readdirSync(extractionRoot).find((entry) => entry.endsWith('.app'))
    if (!appName) {
      fail('iOS simulator archive does not contain a top-level .app bundle')
    }
    return inspectIos(path.join(extractionRoot, appName))
  } finally {
    rmSync(extractionRoot, { force: true, recursive: true })
  }
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]
    if (!key.startsWith('--')) {
      fail(`Unexpected argument: ${key}`)
    }
    args[key.slice(2)] = argv[++index]
  }
  return args
}

export function run(argv) {
  const args = parseArgs(argv)
  if (!['android', 'ios'].includes(args.platform)) {
    fail('--platform must be android or ios')
  }
  if (!args.artifact || !args['app-config'] || !args['metadata-out']) {
    fail('--artifact, --app-config, and --metadata-out are required')
  }
  const configPath = path.resolve(args['app-config'])
  const expo = verifySourceConfig(
    JSON.parse(readFileSync(configPath, 'utf8')),
    path.dirname(configPath)
  )
  const artifact = path.resolve(args.artifact)
  assertEqual(
    path.basename(artifact),
    expectedArtifactName(args.platform, expo.version),
    'artifact name'
  )
  if (!existsSync(artifact)) {
    fail(`Artifact does not exist: ${artifact}`)
  }
  const inspection =
    args.platform === 'android' ? inspectAndroid(artifact) : inspectIosZip(artifact)
  if (args.platform === 'android') {
    verifyAndroidInspection(inspection, expo)
  } else {
    verifyIosInspection(inspection, expo)
  }
  const checksum = sha256(artifact)
  const metadata = {
    artifact: path.basename(artifact),
    platform: args.platform,
    sha256: checksum,
    version: expo.version
  }
  writeFileSync(
    args['metadata-out'],
    `${JSON.stringify(metadata, Object.keys(metadata).sort(), 2)}\n`
  )
  writeFileSync(`${artifact}.sha256`, checksumLine(checksum, path.basename(artifact)))
  return metadata
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  try {
    const metadata = run(process.argv.slice(2))
    console.log(`Verified ${metadata.artifact}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
