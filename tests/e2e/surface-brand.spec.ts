import type { ElectronApplication, Page, TestInfo } from '@stablyai/playwright-test'
import { expect, test } from './helpers/orca-app'

const PRODUCT_TITLE = /^h0x-ADE(?: DEV|: .+)?$/

async function expectHiddenBrandedWindow(
  page: Page,
  electronApp: ElectronApplication
): Promise<void> {
  await expect(page).toHaveTitle(PRODUCT_TITLE)
  await expect
    .poll(() =>
      electronApp.evaluate(({ BrowserWindow }) => {
        const window = BrowserWindow.getAllWindows()[0]
        return window ? { title: window.getTitle(), visible: window.isVisible() } : null
      })
    )
    .toEqual({ title: expect.stringMatching(PRODUCT_TITLE), visible: false })
}

async function attachSurfaceScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot(),
    contentType: 'image/png'
  })
}

test.describe('fresh-profile surface brand', () => {
  test.use({
    dismissOnboarding: false,
    seedTestRepo: false,
    orcaAppExtraEnv: { ORCA_BACKGROUND_LAUNCH: '1' }
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`renders hidden h0x-ADE onboarding in ${theme} theme`, async ({
      electronApp,
      orcaPage
    }, testInfo) => {
      await orcaPage.evaluate(async (nextTheme) => {
        await window.__store?.getState().updateSettingsOrThrow({ theme: nextTheme })
      }, theme)

      const onboarding = orcaPage.locator('[data-onboarding-modal]')
      await expect(onboarding).toBeVisible({ timeout: 30_000 })
      await expect(onboarding.getByText('h0x-ADE', { exact: true })).toBeVisible()
      await expect(onboarding.locator('img[aria-hidden="true"]').first()).toBeVisible()
      await expect
        .poll(() =>
          orcaPage.evaluate(() =>
            document.documentElement.classList.contains('dark') ? 'dark' : 'light'
          )
        )
        .toBe(theme)
      await expectHiddenBrandedWindow(orcaPage, electronApp)
      await attachSurfaceScreenshot(orcaPage, testInfo, `onboarding-${theme}`)
    })
  }
})

test.describe('completed-onboarding surface brand', () => {
  test.use({
    dismissOnboarding: true,
    seedTestRepo: false,
    orcaAppExtraEnv: { ORCA_BACKGROUND_LAUNCH: '1' }
  })

  test('brands landing, navigation, settings, feature tip, and legacy icon migration', async ({
    electronApp,
    orcaPage
  }, testInfo) => {
    await expectHiddenBrandedWindow(orcaPage, electronApp)
    await expect(orcaPage.getByRole('heading', { name: 'h0x-ADE', exact: true })).toBeVisible()
    await expect(orcaPage.locator('.titlebar-logo, [aria-label="h0x-ADE"]').first()).toBeVisible()
    await expect(orcaPage.getByText('h0x-ADE Mobile', { exact: true })).toBeVisible()
    await attachSurfaceScreenshot(orcaPage, testInfo, 'landing-sidebar')

    await expectSecondaryBrandSurfaces(orcaPage, testInfo)
  })
})

async function expectSecondaryBrandSurfaces(page: Page, testInfo: TestInfo): Promise<void> {
  await page.evaluate(() => {
    window.__store?.getState().openModal('feature-tips', { source: 'test', tipId: 'orca-cli' })
  })
  const tip = page.getByRole('dialog')
  await expect(
    tip.getByText('Let agents drive h0x-ADE with the h0x CLI', { exact: true })
  ).toBeVisible()
  await expect(tip.getByText('h0x worktree create --name auth-pr-1', { exact: true })).toBeVisible()
  await expect(tip.getByText('h0x worktree create --name auth-pr-2', { exact: true })).toBeVisible()
  await attachSurfaceScreenshot(page, testInfo, 'feature-tip')

  await page.evaluate(() => window.__store?.getState().closeModal())
  await page.evaluate(() => window.__store?.getState().openSettingsPage())
  await expect
    .poll(() => page.evaluate(() => window.__store?.getState().activeView))
    .toBe('settings')
  await expect(page.getByRole('textbox', { name: 'Search settings' })).toBeVisible()
  await expect(page.getByText(/h0x-ADE|h0x CLI/).first()).toBeVisible()
  await attachSurfaceScreenshot(page, testInfo, 'settings')

  const normalizedIcon = await page.evaluate(async () => {
    await window.__store?.getState().updateSettingsOrThrow({ appIcon: 'watercolor' as 'classic' })
    return (await window.api.settings.get()).appIcon
  })
  expect(normalizedIcon).toBe('classic')
}
