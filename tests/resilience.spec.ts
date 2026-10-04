import { expect, test } from '@playwright/test'

test('a failed optional world module leaves the portfolio and project navigation usable', async ({ page }) => {
  let rejectedWorld = false
  await page.route(/\/(?:src\/webgl\/World\.tsx|assets\/World[-.][^/?]+\.js)(?:\?.*)?$/, async route => {
    rejectedWorld = true
    await route.abort('failed')
  })
  await page.goto('/')
  await expect.poll(() => rejectedWorld).toBe(true)
  await expect(page.getByRole('heading', { name: 'Srijit Gyawali', exact: true })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'INDEX' }).click()
  const index = page.getByRole('dialog')
  await expect(index).toBeVisible()
  await index.locator('a[href="#cex"]').click()
  await expect(page).toHaveURL(/#cex$/)
  await page.locator('#cex').getByRole('button', { name: 'Explore the build' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'The problem', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('a[href="mailto:gyawalisrijit@gmail.com"]')).toBeAttached()
})

test('request dispatch retains keyboard focus and announces each request', async ({ page }) => {
  await page.goto('/')
  const request = page.getByRole('button', { name: 'SEND REQUEST' })
  await request.focus()
  await page.keyboard.press('Enter')
  await expect(request).toBeFocused()
  await expect(page.getByRole('status')).toHaveText('REQUEST 01 DISPATCHED')
  await page.keyboard.press('Space')
  await expect(request).toBeFocused()
  await expect(page.getByRole('status')).toHaveText('REQUEST 02 DISPATCHED')
})
