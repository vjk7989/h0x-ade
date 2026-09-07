import { expect, test } from './helpers/orca-app'

test.use({ dismissOnboarding: false, seedTestRepo: false })

test('fresh profile renders the h0x-ADE brand and logo', async ({ orcaPage }) => {
  const onboarding = orcaPage.locator('[data-onboarding-modal]')
  await expect(onboarding).toBeVisible({ timeout: 30_000 })
  await expect(onboarding.getByText('h0x-ADE', { exact: true })).toBeVisible()

  const logo = onboarding.locator('img[aria-hidden="true"]').first()
  await expect(logo).toBeVisible()
  await expect
    .poll(async () => {
      const bounds = await logo.boundingBox()
      return Boolean(bounds && bounds.width > 0 && bounds.height > 0)
    })
    .toBe(true)
})
