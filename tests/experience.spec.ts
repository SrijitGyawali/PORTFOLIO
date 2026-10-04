import { expect, test } from '@playwright/test'

test('desktop loads one persistent world and exposes all four project records', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('heading', { name: 'Srijit Gyawali', exact: true })).toBeVisible()
  await expect(page.locator('.webgl-world')).toHaveAttribute('data-webgl', 'ready')
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.screenshot({ path: 'test-results/desktop-hero.png' })
  for (const id of ['verix', 'cex', 'tapguard', 'smartmarket']) {
    const chapter = page.locator(`#${id}`)
    await chapter.getByRole('button', { name: 'Explore the build' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The problem', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Technical decisions', exact: true })).toBeAttached()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(chapter.getByRole('button', { name: 'Explore the build' })).toBeFocused()
    await expect(page.locator('canvas')).toHaveCount(1)
  }
  expect(errors).toEqual([])
})

test('index is keyboard accessible and links to every chapter', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'INDEX' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link')).toHaveCount(4)
  await page.keyboard.press('Tab')
  await expect(dialog.locator('a').first()).toBeFocused()
  await dialog.locator('a[href="#cex"]').click()
  await expect(dialog).not.toBeVisible()
  await expect(page).toHaveURL(/#cex$/)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('capability controls, motion pause, and request flow respond', async ({ page }) => {
  await page.goto('/')
  const distributed = page.getByRole('tab', { name: '02 DISTRIBUTED' })
  await distributed.click()
  await expect(distributed).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('Kafka / Message Queues')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: '03 WEB3' })).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('Solana / Anchor / Rust')
  await page.getByRole('button', { name: 'Pause ambient animation' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused')
  await page.getByRole('button', { name: 'Resume ambient animation' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'running')
  await page.getByRole('button', { name: 'SEND REQUEST' }).click()
  await expect(page.getByRole('status')).toHaveText('REQUEST 01 DISPATCHED')
  await page.locator('#systems').screenshot({ path: 'test-results/architecture.png' })
})

test('mobile has no horizontal overflow and maintains usable project details', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.webgl-world')).toHaveAttribute('data-webgl', 'ready')
  await expect(page.locator('.hero-letter').last()).toHaveCSS('opacity', '1')
  await page.screenshot({ path: 'test-results/mobile-hero.png' })
  for (const id of ['home', 'proof', 'capabilities', 'verix', 'cex', 'tapguard', 'smartmarket', 'systems', 'about', 'contact']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  for (const title of await page.locator('.project-title').all()) {
    expect(await title.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  }
  await page.locator('#tapguard').getByRole('button', { name: 'Explore the build' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.getByRole('dialog').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  await page.getByRole('button', { name: 'Close project details' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.locator('#contact').screenshot({ path: 'test-results/mobile-contact.png' })
  await context.close()
})

test('reduced motion preserves content and navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true')
  await expect(page.locator('.hero-letter').first()).toHaveCSS('opacity', '1')
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'INDEX' }).click()
  await page.getByRole('dialog').locator('a[href="#verix"]').click()
  await expect(page).toHaveURL(/#verix$/)
  await expect(page.locator('#verix').getByRole('button')).toBeVisible()
})

test('WebGL failure leaves all content and real contact links available', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return original.apply(this, [type, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('.webgl-world')).toHaveAttribute('data-webgl', 'fallback')
  await expect(page.getByRole('heading', { name: 'Srijit Gyawali', exact: true })).toBeVisible()
  await expect(page.locator('a[href="mailto:gyawalisrijit@gmail.com"]')).toHaveCount(1)
  await expect(page.locator('a[href="https://github.com/SrijitGyawali/"]')).toHaveCount(1)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'INDEX' }).click()
  await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(4)
})
