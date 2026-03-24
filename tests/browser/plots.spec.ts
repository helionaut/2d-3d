import { expect, test } from '@playwright/test'

test.describe('graph calculator flows', () => {
  test('renders responsive 2D and 3D calculator shells', async ({ page }, testInfo) => {
    await page.goto('/')

    const formulaInput = page.getByRole('textbox', { name: 'Expression' })
    const renderButton = page.getByRole('button', { name: 'Render graph' })

    await expect(formulaInput).toHaveValue('y = sin(x)')
    await expect(page.getByRole('button', { name: /2D curve/i })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('X minimum')).toBeVisible()
    await expect(page.getByLabel('Samples')).toBeVisible()
    await expect(renderButton).toBeVisible()
    await expect(page.getByTestId('plot-2d')).toBeVisible()
    await expect(page.getByTestId('plot-2d').locator('.main-svg').first()).toBeVisible()
    await expect(page.getByTestId('rendered-expression-value')).toHaveText('y = sin(x)')

    await page.getByLabel('Samples').fill('181')
    await renderButton.click()
    await expect(page.getByTestId('rendered-samples')).toHaveText('181')

    const curveViewport = page.getByTestId('plot-2d')
    const curveBox = await curveViewport.boundingBox()
    if (curveBox) {
      await page.mouse.move(curveBox.x + curveBox.width / 2, curveBox.y + curveBox.height / 2)
      await page.mouse.wheel(0, -150)
      await page.mouse.down()
      await page.mouse.move(curveBox.x + curveBox.width / 2 + 30, curveBox.y + curveBox.height / 2, {
        steps: 8,
      })
      await page.mouse.up()
    }

    await page.screenshot({
      path: `reports/out/visual/hel-89-${testInfo.project.name}-2d.png`,
      fullPage: true,
    })

    if (testInfo.project.name === 'desktop-chromium') {
      await formulaInput.fill('2x')
      await expect(page.getByRole('alert')).toContainText('implicit multiplication')
      await expect(page.getByTestId('plot-2d')).toBeVisible()
      await formulaInput.fill('y = sin(x)')
    }

    await page.getByRole('button', { name: /3D surface/i }).click()

    await expect(formulaInput).toHaveValue('z = sin(x) * cos(y)')
    await expect(page.getByLabel('Z minimum')).toBeVisible()
    await expect(page.getByLabel('X samples')).toBeVisible()
    await expect(page.getByTestId('plot-3d')).toBeVisible()
    await expect(page.getByTestId('plot-3d').locator('canvas').first()).toBeVisible()
    await expect(page.getByTestId('rendered-expression-value')).toHaveText('z = sin(x) * cos(y)')

    await page.getByLabel('X samples').fill('21')
    await page.getByLabel('Y samples').fill('19')
    await renderButton.click()
    await expect(page.getByTestId('rendered-x-samples')).toHaveText('21')
    await expect(page.getByTestId('rendered-y-samples')).toHaveText('19')

    const surfaceViewport = page.getByTestId('plot-3d')
    const surfaceBox = await surfaceViewport.boundingBox()
    if (surfaceBox) {
      await page.mouse.move(surfaceBox.x + surfaceBox.width / 2, surfaceBox.y + surfaceBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(surfaceBox.x + surfaceBox.width / 2 + 40, surfaceBox.y + surfaceBox.height / 2 - 30, {
        steps: 8,
      })
      await page.mouse.up()
      await page.mouse.wheel(0, -150)
    }

    await page.screenshot({
      path: `reports/out/visual/hel-89-${testInfo.project.name}-3d.png`,
      fullPage: true,
    })
  })
})
