import { test, expect } from '@playwright/test'

test('pointer tear is irreversible until reattached', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const pass = page.locator('.boarding-pass')
  const stub = page.getByRole('button', { name: 'Tear off stub' })
  const box = await stub.boundingBox()
  if (!box) throw new Error('Stub is missing')
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 95, y, { steps: 12 })
  const partial = Number(await pass.getAttribute('data-tear-progress'))
  expect(partial).toBeGreaterThan(0)
  expect(partial).toBeLessThan(1)
  await page.mouse.move(x + 20, y, { steps: 6 })
  expect(Number(await pass.getAttribute('data-tear-progress'))).toBe(partial)
  await page.mouse.move(x + 230, y + 10, { steps: 12 })
  await page.mouse.up()
  await expect(pass).toHaveAttribute('data-detached', 'true')
  await expect(page.locator('.pass-status')).toHaveText('Stub torn off')
  await page.getByRole('button', { name: 'Reattach', exact: true }).click()
  await expect(pass).toHaveAttribute('data-tear-progress', '0.00')
  expect(errors).toEqual([])
})

test('keyboard, themes and live controls', async ({ page }) => {
  await page.goto('/')
  const stub = page.getByRole('button', { name: 'Tear off stub' })
  await stub.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.boarding-pass')).toHaveAttribute('data-detached', 'true')
  await page.getByRole('button', { name: 'Reattach', exact: true }).click()
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click()
  await expect(page.locator('.page')).toHaveClass('page dark')
  await page.locator('.dialkit-panel-inner').click()
  await page.getByRole('textbox', { name: 'Passenger', exact: true }).fill('River/Sam')
  await expect(page.locator('.pass-passenger')).toContainText('River/Sam')
  await expect(page.getByRole('slider', { name: 'Tear Distance', exact: true })).toBeVisible()
})

test('reduced motion and narrow viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const pass = page.locator('.boarding-pass')
  const box = await pass.boundingBox()
  if (!box) throw new Error('Pass is missing')
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Tear off stub' }).press('Space')
  await expect(pass).toHaveAttribute('data-detached', 'true')
  await expect(pass).toHaveAttribute('data-reduced-motion', 'true')
})

test('placeholder airline marks load without workshop assets', async ({ page }) => {
  await page.goto('/')
  await page.locator('.dialkit-panel-inner').click()
  for (const [previous, next] of [['Northline', 'Daybreak'], ['Daybreak', 'Waypoint'], ['Waypoint', 'Northline']]) {
    await page.getByRole('button', { name: `Airline ${previous}`, exact: true }).click()
    await page.getByRole('option', { name: next, exact: true }).click()
    await expect(page.locator('.pass-logo').first()).toHaveAttribute('aria-label', `${next} (placeholder)`)
    const loaded = await page.locator('.pass-logo').first().evaluate(async node => {
      const url = getComputedStyle(node).maskImage.slice(5, -2)
      const image = new Image()
      image.src = url
      await image.decode()
      return image.naturalWidth > 0
    })
    expect(loaded).toBe(true)
  }
})
