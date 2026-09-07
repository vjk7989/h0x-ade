import { describe, expect, it } from 'vitest'

import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import zh from './locales/zh.json'

const catalogs = { en, es, fr, ja, ko, zh }

const H0X_ADE_SURFACE_KEYS = [
  'auto.App.5096cbbc86',
  'auto.components.Landing.6ca6ff404e',
  'auto.components.Landing.520304a067',
  'auto.components.mobile.MobileHero.e75647ace0',
  'auto.components.mobile.MobileHero.b4ccce5cb7',
  'auto.components.mobile.MobileHero.5410d55d79',
  'auto.components.mobile.MobileHero.266c18c105',
  'auto.components.mobile.MobileHero.d1495e5e64',
  'auto.components.mobile.MobileHero.pairingQrError',
  'auto.components.mobile.MobilePageToolbar.9883b58693',
  'auto.components.mobile.PhoneCarousel.89c7713645',
  'auto.components.mobile.WindowsFirewallNotice.repair-success',
  'auto.components.mobile.WindowsFirewallNotice.blocked-title',
  'auto.components.mobile.WindowsFirewallNotice.public-description',
  'auto.components.mobile.WindowsFirewallNotice.blocked-description',
  'auto.components.mobile.WindowsFirewallNotice.missing-description',
  'auto.components.mobile.slides.HomeSlide.5d94e8ddcc',
  'auto.components.onboarding.OnboardingFlow.a249f81538',
  'auto.components.onboarding.OnboardingFlow.277ba45540',
  'auto.components.onboarding.OnboardingFlow.1b5e182e9f',
  'auto.components.onboarding.OnboardingFlow.322fc50a18',
  'auto.components.onboarding.OnboardingFlow.ff92d15436',
  'auto.components.sidebar.SidebarNav.1b5c41caee',
  'auto.components.settings.AppearancePane.9da1020447',
  'auto.components.settings.AppearancePane.61d842eca0',
  'auto.components.settings.CliSection.6930feda9e',
  'auto.components.settings.CliSection.36a6f919ba',
  'auto.components.settings.CliSection.e8012c03a1',
  'auto.components.settings.MobilePane.pairingQrError',
  'auto.components.settings.MobilePane.310924ad2c',
  'auto.components.settings.MobilePane.dd3cd78d04',
  'auto.components.settings.MobileSettingsPane.installIntro',
  'auto.components.settings.MobileSettingsPane.1de96ec8a6',
  'auto.components.settings.MobileSettingsPane.682293cadf',
  'auto.components.settings.MobileSettingsPane.d4f2b65f30',
  'auto.components.settings.MobilePairingSetupSection.overview',
  'auto.components.settings.Settings.21f09426ea',
  'auto.components.settings.Settings.475980f53d',
  'auto.components.settings.Settings.linearDescription',
  'auto.components.settings.Settings.6855b0f77d',
  'auto.components.settings.orcaAccount.unavailable',
  'auto.components.settings.orcaAccount.signedOut',
  'auto.components.settings.orcaAccount.account',
  'auto.components.settings.orcaAccount.signIn',
  'auto.components.settings.orcaAccount.artifactsDescription',
  'auto.components.settings.orcaAccount.title',
  'auto.components.settings.orcaAccount.description',
  'auto.components.settings.orcaAccount.relayDescription',
  'auto.components.settings.appearance.search.1de96ec8a6',
  'auto.components.settings.appearance.search.682293cadf',
  'auto.components.settings.mobile.settings.search.1de96ec8a6',
  'auto.components.settings.mobile.settings.search.682293cadf',
  'auto.components.star.nag.StarNagToastHost.body',
  'auto.components.native-chat.NativeChat.orchestrationPaused.message',
  'auto.hooks.useSettingsNavigationMetadata.cd50cec5d7',
  'auto.hooks.useSettingsNavigationMetadata.linearDescription',
  'auto.hooks.useSettingsNavigationMetadata.5f32ac08f3',
  'auto.hooks.useSettingsNavigationMetadata.0505d0df29'
] as const

const H0X_CLI_SURFACE_KEYS = ['auto.components.settings.CliSection.c5c0f2641d'] as const

const ORCA_RELAY_COMPATIBILITY_KEYS = [
  'auto.components.settings.orcaAccount.signedOut'
] as const

function lookup(catalog: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      catalog
    )
}

describe('h0x-ADE surface brand catalog contract', () => {
  it.each(Object.entries(catalogs))(
    '%s renders the display brand on rebranded surfaces',
    (code, catalog) => {
      for (const key of H0X_ADE_SURFACE_KEYS) {
        const value = lookup(catalog, key) ?? lookup(en, key)
        expect(value, `${code}:${key} must resolve to a string`).toEqual(expect.any(String))
        expect(value, `${code}:${key} must render the h0x-ADE display brand`).toContain('h0x-ADE')
      }

      for (const key of H0X_CLI_SURFACE_KEYS) {
        const value = lookup(catalog, key) ?? lookup(en, key)
        expect(value, `${code}:${key} must resolve to a string`).toEqual(expect.any(String))
        expect(value, `${code}:${key} must render the h0x CLI brand`).toContain('h0x CLI')
      }

      for (const key of ORCA_RELAY_COMPATIBILITY_KEYS) {
        const value = lookup(catalog, key) ?? lookup(en, key)
        expect(value, `${code}:${key} must preserve the Orca Relay product name`).toContain(
          'Orca Relay'
        )
      }
    }
  )
})
