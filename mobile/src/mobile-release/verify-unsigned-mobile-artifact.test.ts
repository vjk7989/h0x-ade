import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  checksumLine,
  expectedArtifactName,
  parseAndroidManifestSchemes,
  parseAndroidIconEntries,
  verifyUnsignedApkResult,
  verifySourceConfig,
  verifyAndroidInspection,
  verifyIosInspection
} from '../../scripts/verify-unsigned-mobile-artifact.mjs'
import { removeReleaseDebugSigning } from '../../scripts/disable-android-release-signing.mjs'

const mobileRoot = fileURLToPath(new URL('../../', import.meta.url))
const productionConfig = JSON.parse(readFileSync(`${mobileRoot}/app.json`, 'utf8'))
const workflow = readFileSync(
  `${mobileRoot}/../.github/workflows/unsigned-mobile-build.yml`,
  'utf8'
)
const verifierSource = readFileSync(
  `${mobileRoot}/scripts/verify-unsigned-mobile-artifact.mjs`,
  'utf8'
)

const expo = {
  name: 'h0x-ADE Mobile',
  version: '0.0.48',
  slug: 'h0x-mobile',
  scheme: 'pavii-h0x',
  android: { package: 'tech.pavii.h0xade.mobile' },
  ios: { bundleIdentifier: 'tech.pavii.h0xade.mobile' }
}

const android = {
  package: 'tech.pavii.h0xade.mobile',
  versionName: '0.0.48',
  label: 'h0x-ADE Mobile',
  schemes: 'pavii-h0x',
  iconEntries: ['res/mipmap-hdpi-v4/ic_launcher.webp'],
  permissionDescriptions: {
    camera: 'Allow h0x-ADE to scan a pairing QR code.',
    microphone: 'Allow h0x-ADE to record voice dictation.',
    photos: 'Allow h0x-ADE to attach photos.'
  }
}

const ios = {
  bundleIdentifier: 'tech.pavii.h0xade.mobile',
  version: '0.0.48',
  displayName: 'h0x-ADE Mobile',
  schemes: 'pavii-h0x',
  permissionDescriptions: {
    localNetwork: 'h0x-ADE connects to the desktop app on your LAN.',
    microphone: 'Allow h0x-ADE to record voice dictation.',
    photos: 'Allow h0x-ADE to attach photos.',
    camera: 'Allow h0x-ADE to scan a pairing QR code.'
  },
  hasMachOExecutable: true,
  hasAssetCatalog: true
}

describe('unsigned mobile artifact verifier', () => {
  it('pins source identity and exact branded asset bytes', () => {
    expect(() => verifySourceConfig(productionConfig, mobileRoot)).not.toThrow()
    expect(() =>
      verifySourceConfig(
        { ...productionConfig, expo: { ...productionConfig.expo, slug: 'other' } },
        mobileRoot
      )
    ).toThrow(/app slug/)
  })

  it('accepts canonical Android and iOS inspections', () => {
    expect(() => verifyAndroidInspection(android, expo)).not.toThrow()
    expect(() => verifyIosInspection(ios, expo)).not.toThrow()
  })

  it('accepts only canonical and Expo technical URL schemes', () => {
    expect(() =>
      verifyAndroidInspection(
        { ...android, schemes: 'exp+h0x-mobile,pavii-h0x,tech.pavii.h0xade.mobile' },
        expo
      )
    ).not.toThrow()
    expect(() =>
      verifyIosInspection(
        { ...ios, schemes: 'exp+h0x-mobile,pavii-h0x,tech.pavii.h0xade.mobile' },
        expo
      )
    ).not.toThrow()
    expect(() => verifyIosInspection({ ...ios, schemes: 'pavii-h0x,unknown' }, expo)).toThrow(
      /unexpected schemes/
    )
    expect(() => verifyAndroidInspection({ ...android, schemes: 'pavii-h0x,https' }, expo)).toThrow(
      /unexpected schemes/
    )
  })

  it.each([
    ['package', 'wrong.package'],
    ['versionName', '0.0.47'],
    ['label', 'Orca Mobile'],
    ['schemes', 'orca,pavii-h0x']
  ])('rejects Android %s drift', (field, value) => {
    expect(() => verifyAndroidInspection({ ...android, [field]: value }, expo)).toThrow()
  })

  it.each([
    ['bundleIdentifier', 'wrong.bundle'],
    ['version', '0.0.47'],
    ['displayName', 'Orca Mobile'],
    ['schemes', 'orca,pavii-h0x']
  ])('rejects iOS %s drift', (field, value) => {
    expect(() => verifyIosInspection({ ...ios, [field]: value }, expo)).toThrow()
  })

  it('rejects stale visible permission copy and missing packaged assets', () => {
    expect(() =>
      verifyIosInspection(
        {
          ...ios,
          permissionDescriptions: { ...ios.permissionDescriptions, camera: 'Allow Orca.' }
        },
        expo
      )
    ).toThrow(/legacy Orca branding/)
    expect(() => verifyAndroidInspection({ ...android, iconEntries: [] }, expo)).toThrow(
      /icon resources/
    )
    expect(() => verifyIosInspection({ ...ios, hasAssetCatalog: false }, expo)).toThrow(
      /Assets.car/
    )
  })

  it('uses deterministic artifact and checksum-compatible names', () => {
    expect(expectedArtifactName('android', '0.0.48')).toBe('h0x-ade-mobile-0.0.48-android.apk')
    expect(expectedArtifactName('ios', '0.0.48')).toBe('h0x-ade-mobile-0.0.48-ios-simulator.zip')
    const checksum = 'a'.repeat(64)
    expect(checksumLine(checksum, 'h0x-ade-mobile-0.0.48-android.apk')).toBe(
      `${checksum}  h0x-ade-mobile-0.0.48-android.apk\n`
    )
    expect(() => checksumLine('not-a-checksum', 'artifact.apk')).toThrow(/64 lowercase hex/)
  })

  it('accepts only the expected apksigner unsigned result', () => {
    expect(() =>
      verifyUnsignedApkResult({ status: 1, stdout: 'DOES NOT VERIFY', stderr: '' })
    ).not.toThrow()
    expect(() => verifyUnsignedApkResult({ status: 0, stdout: 'Verified', stderr: '' })).toThrow(
      /APK is signed/
    )
    expect(() =>
      verifyUnsignedApkResult({ status: 1, stdout: '', stderr: 'file not found' })
    ).toThrow(/Unable to prove/)
    expect(() =>
      verifyUnsignedApkResult({
        status: 1,
        stdout: 'DOES NOT VERIFY\nSigner certificate DN: CN=Debug',
        stderr: ''
      })
    ).toThrow(/Unable to prove/)
  })

  it('reads only resolved URL schemes from packaged data elements', () => {
    const filter = (data: string) => `<intent-filter>${data}</intent-filter>`
    expect(
      parseAndroidManifestSchemes(
        [
          '<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
          '  <queries><intent><data android:scheme="https" /></intent></queries>',
          '  <application android:label="scheme=pavii-h0x">',
          '    <activity>',
          '      <intent-filter>',
          '        <data android:host="ignored"',
          '          android:scheme="pavii-h0x" />',
          "        <data android:scheme='exp+h0x-mobile' android:host='ignored' />",
          '        <data android:schemeExtra="ignored" android:scheme="tech.pavii.h0xade.mobile" />',
          '      </intent-filter>',
          '    </activity>',
          '  </application>',
          '</manifest>'
        ].join('\n')
      )
    ).toEqual(['pavii-h0x', 'exp+h0x-mobile', 'tech.pavii.h0xade.mobile'])
    expect(parseAndroidManifestSchemes(filter('<data android:scheme="https" />'))).toEqual([
      'https'
    ])
    expect(parseAndroidManifestSchemes(filter('<data android:scheme="pavii&#45;h0x" />'))).toEqual(
      []
    )
    expect(parseAndroidManifestSchemes(filter('<data foo:android:scheme="pavii-h0x" />'))).toEqual(
      []
    )
    expect(
      parseAndroidManifestSchemes(filter('<data-extra android:scheme="pavii-h0x" />'))
    ).toEqual([])
    expect(parseAndroidManifestSchemes(filter('<data x-android:scheme="pavii-h0x" />'))).toEqual([])
    expect(
      parseAndroidManifestSchemes(filter('<!-- <data android:scheme="pavii-h0x" /> -->'))
    ).toEqual([])
    expect(
      parseAndroidManifestSchemes(
        '<queries><intent><data android:scheme="pavii-h0x" /></intent></queries>'
      )
    ).toEqual([])
    expect(parseAndroidManifestSchemes('A: android:scheme="pavii-h0x"')).toEqual([])
  })

  it('verifies launcher icons resolved by Android badging', () => {
    const entries = [
      'res/mipmap-anydpi-v26/ic_launcher.xml',
      'res/mipmap-hdpi-v4/ic_launcher.webp',
      'res/drawable-hdpi-v4/ic_launcher.png'
    ]
    expect(
      parseAndroidIconEntries(
        [
          "application-icon-160:'res/mipmap-anydpi-v26/ic_launcher.xml'",
          "application-icon-240:'res/mipmap-hdpi-v4/ic_launcher.webp'",
          "application-icon-320:'res/drawable-hdpi-v4/ic_launcher.png'",
          "launchable-activity: name='MainActivity'"
        ].join('\n'),
        entries
      )
    ).toEqual([...entries].sort())
    expect(() =>
      parseAndroidIconEntries("application-icon-160:'res/mipmap/../icon.png'", entries)
    ).toThrow(/invalid launcher icon/)
    expect(() =>
      parseAndroidIconEntries("application-icon-hdpi:'res/mipmap-hdpi-v4/icon.png'", entries)
    ).toThrow(/invalid launcher icon/)
    expect(() =>
      parseAndroidIconEntries("application-icon-160:'res/mipmap-hdpi-v4/icon.svg'", entries)
    ).toThrow(/invalid launcher icon/)
    expect(() =>
      parseAndroidIconEntries("application-icon-160:'res/mipmap-hdpi-v4/missing.png'", entries)
    ).toThrow(/absent from APK/)
  })

  it('builds Android with signing disabled and verifies the packaged signature', () => {
    expect(workflow).not.toContain('pull_request:')
    expect(workflow).toContain('ref: ${{ inputs.ref || github.ref }}')
    expect(workflow).toContain('node scripts/disable-android-release-signing.mjs')
    expect(workflow).toContain('export APKSIGNER=')
    expect(verifierSource).toContain("['manifest', 'print', artifact]")
    expect(workflow).toContain('export APKANALYZER=')
    expect(workflow).toContain('pod install --project-directory=ios')
    expect(workflow).toContain('workspaces=(ios/*.xcworkspace)')
    expect(workflow).toContain('app_projects=(ios/*.xcodeproj)')
    expect(workflow).toContain('scheme === process.argv[1]')
    expect(workflow).toContain('apps=(build/ios/Build/Products/Release-iphonesimulator/*.app)')
  })

  it('removes signing only from the generated Android release block', () => {
    const source = `android {
  buildTypes {
    debug {
      signingConfig signingConfigs.debug
    }
    release {
      signingConfig signingConfigs.debug
      minifyEnabled true
    }
  }
}
`
    const result = removeReleaseDebugSigning(source)
    expect(result).toContain('debug {\n      signingConfig signingConfigs.debug')
    expect(result).toContain('release {\n\n      minifyEnabled true')
    expect(() => removeReleaseDebugSigning(result)).toThrow(/found 0/)
    expect(() =>
      removeReleaseDebugSigning(
        `buildTypes { debug {} }\nother { release {\n signingConfig signingConfigs.debug\n} }`
      )
    ).toThrow(/not found inside build types/)
    expect(() =>
      removeReleaseDebugSigning(
        `buildTypes { release {\n signingConfig signingConfigs.debug\n} release {\n signingConfig signingConfigs.debug\n} }`
      )
    ).toThrow(/multiple release blocks/)
  })
})
