import { expect, test } from '@playwright/test'

import { graphFixtures } from '../../fixtures/graphFixtures'

test.describe('rendering spike', () => {
  test('renders the canonical 2D and 3D acceptance examples', async ({ page }) => {
    await page.goto('/')

    for (const fixture of graphFixtures) {
      await expect(page.getByText(fixture.expression, { exact: true })).toBeVisible()
      const plot = page.getByTestId(fixture.plotTestId)
      await expect(plot).toBeVisible()

      if (fixture.mode === '2D') {
        await expect(plot.locator('.main-svg').first()).toBeVisible()
      } else {
        await expect(plot.locator('canvas').first()).toBeVisible()
      }
    }
  })
})
