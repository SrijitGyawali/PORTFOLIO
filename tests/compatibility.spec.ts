import { expect, test } from '@playwright/test'

test('engine compatibility: scroll chapters, dialogs and fallback preserve the story', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Srijit Gyawali', exact: true })).toBeVisible()
  await expect(page.locator('.webgl-world')).toHaveAttribute('data-webgl', /ready|fallback/)
  testInfo.annotations.push({ type: 'renderer', description: await page.locator('.webgl-world').getAttribute('data-webgl') ?? '' })
  for (const id of ['cex', 'tapguard', 'systems', 'contact']) {
    await page.locator(`#${id}`).evaluate(node => node.scrollIntoView({ behavior: 'instant' }))
    await expect(page.locator('html')).toHaveAttribute('data-chapter', id)
  }
  await page.getByRole('button', { name: 'OPEN PROJECT INDEX' }).click()
  await page.getByRole('dialog').locator('a[href="#smartmarket"]').click()
  await page.locator('#smartmarket').getByRole('button').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('link', { name: 'VIEW SOURCE' })).toHaveAttribute('href', 'https://github.com/NirajBhattarai/a2amarketplace')
  await expect(dialog.getByRole('link', { name: 'PROJECT SHOWCASE' })).toHaveAttribute('href', 'https://ethglobal.com/showcase/smartmarket-1g67h')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  expect(errors).toEqual([])
})

test('engine compatibility: 320px layout keeps project titles readable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const title of await page.locator('.project-title').all()) {
    expect(await title.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('navigation').getByRole('button', { name: 'MENU' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.getByRole('dialog').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  await page.keyboard.press('Escape')
})
