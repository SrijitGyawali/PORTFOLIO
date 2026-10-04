import { expect, test } from '@playwright/test'

test('copy fallback selects only the email address', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard permission denied') } } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'COPY EMAIL' }).click()
  await expect(page.getByRole('button', { name: 'SELECTED — COPY MANUALLY' })).toBeVisible()
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('gyawalisrijit@gmail.com')
})

test('copy success and social links use the supplied contact information', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { document.documentElement.dataset.copiedText = value } } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'COPY EMAIL' }).click()
  await expect(page.getByRole('button', { name: 'COPIED ✓' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-copied-text', 'gyawalisrijit@gmail.com')
  await expect(page.getByRole('link', { name: 'LINKEDIN' })).toHaveAttribute('href', 'https://www.linkedin.com/in/srijit-gyawali-09aa7a233/')
  await expect(page.getByRole('link', { name: 'GITHUB', exact: false })).toHaveAttribute('href', 'https://github.com/SrijitGyawali/')
})

test('modal controls and narrow pointer layouts keep a visible native cursor', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button', { name: 'INDEX' }).click()
  await expect(page.getByRole('button', { name: 'Close project index' })).toHaveCSS('cursor', 'pointer')
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 700, height: 900 })
  await expect(page.locator('html')).not.toHaveClass(/has-cursor/)
  await expect(page.getByRole('navigation').getByRole('button', { name: 'INDEX' })).toHaveCSS('cursor', 'pointer')
})
