import { expect, test } from '@playwright/test'

test.describe('graph calculator flows', () => {
  test('accepts the canonical 2D and 3D formulas with visible plots', async ({ page }, testInfo) => {
    await page.goto('/')

    const formulaInput = page.getByRole('textbox', { name: 'Formula' })
    await expect(formulaInput).toHaveValue('y = sin(x)')
    await expect(page.getByTestId('plot-2d')).toBeVisible()
    await expect(page.getByTestId('plot-2d').locator('.main-svg').first()).toBeVisible()
    await expect(page.getByTestId('stored-expression-value')).toHaveText('sin(x)')

    if (testInfo.project.name === 'desktop-chromium') {
      await page.screenshot({
        path: 'reports/out/visual/hel-88-desktop-2d.png',
        fullPage: true,
      })

      await formulaInput.fill('2x')
      await expect(page.getByRole('alert')).toContainText('implicit multiplication')
      await expect(page.getByTestId('plot-2d')).toBeVisible()
      await page.screenshot({
        path: 'reports/out/visual/hel-88-desktop-invalid.png',
        fullPage: true,
      })

      await formulaInput.fill('y = sin(x)')
      await expect(page.getByRole('status')).toContainText('Valid formula')
    }

    await page.getByRole('button', { name: /3D surface/i }).click()

    await expect(formulaInput).toHaveValue('z = sin(x) * cos(y)')
    await expect(page.getByTestId('plot-3d')).toBeVisible()
    await expect(page.getByTestId('plot-3d').locator('canvas').first()).toBeVisible()
    await expect(page.getByTestId('stored-expression-value')).toHaveText('sin(x) * cos(y)')

    if (testInfo.project.name === 'mobile-chromium') {
      await page.screenshot({
        path: 'reports/out/visual/hel-88-mobile-3d.png',
        fullPage: true,
      })
    }
  })
})
