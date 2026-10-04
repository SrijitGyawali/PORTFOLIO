import { expect, test } from '@playwright/test'

test('desktop wheel eases promptly, updates chapter state, and reverses without drift', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('html')).toHaveAttribute('data-string-scroll-mode', 'smooth')
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  await expect(page.locator('.hero-letter').last()).toHaveCSS('opacity', '1')
  await page.mouse.move(1200, 500)

  const sampling = page.evaluate(() => new Promise<Array<[number, number]>>((resolve) => {
    const points: Array<[number, number]> = []
    const start = performance.now()
    const sample = (time: number) => {
      points.push([time - start, window.scrollY])
      if (time - start < 1200) requestAnimationFrame(sample)
      else resolve(points)
    }
    requestAnimationFrame(sample)
  }))
  await page.mouse.wheel(0, 600)
  const points = await sampling
  const settled = points.at(-1)![1]
  expect(settled).toBeGreaterThan(350)
  expect(settled).toBeLessThan(700)
  expect(points.filter(point => point[1] > 0 && point[1] < settled * 0.95).length).toBeGreaterThan(3)
  const first = points.find(point => point[1] > 1)![0]
  const ninetyPercent = points.find(point => point[1] >= settled * 0.9)![0]
  // Allows a slow software-rendered CI frame while rejecting a prolonged glide.
  expect(ninetyPercent - first).toBeLessThan(550)
  expect(Math.abs(points.at(-6)![1] - settled)).toBeLessThan(2)
  await expect.poll(() => page.locator('[data-global-progress]').getAttribute('data-progress')).not.toBe('0')

  await page.mouse.wheel(0, -600)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(3)
  await expect(page.locator('html')).toHaveAttribute('data-chapter', 'home')
})

test('chapter anchors and index share the controller and preserve back/forward history', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await nav.getByRole('link', { name: 'WORK', exact: true }).click()
  await expect(page).toHaveURL(/#verix$/)
  await expect.poll(() => page.locator('#verix').evaluate(node => node.getBoundingClientRect().top)).toBeCloseTo(88, -1)
  await expect(nav.getByRole('link', { name: 'WORK', exact: true })).toHaveAttribute('aria-current', 'location')

  await nav.getByRole('button', { name: 'INDEX' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-string-scroll-mode', 'disable')
  await page.getByRole('dialog').locator('a[href="#cex"]').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page).toHaveURL(/#cex$/)
  await expect(page.locator('html')).toHaveAttribute('data-string-scroll-mode', 'smooth')
  await expect.poll(() => page.locator('#cex').evaluate(node => node.getBoundingClientRect().top)).toBeCloseTo(88, -1)

  await page.goBack()
  await expect(page).toHaveURL(/#verix$/)
  await expect(page.locator('html')).toHaveAttribute('data-chapter', 'verix')
  await page.goForward()
  await expect(page).toHaveURL(/#cex$/)
  await expect(page.locator('html')).toHaveAttribute('data-chapter', 'cex')
})

test('wheel input scrolls an open project dialog without moving the background', async ({ page }) => {
  await page.goto('/#verix')
  await page.locator('#verix').getByRole('button', { name: 'Explore the build' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-string-scroll-mode', 'disable')
  const background = await page.evaluate(() => window.scrollY)
  await dialog.hover()
  await page.mouse.wheel(0, 620)
  await expect.poll(() => dialog.evaluate(node => node.scrollTop)).toBeGreaterThan(100)
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(background, 0)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-string-scroll-mode', 'smooth')
})

test('keyboard navigation works and reduced motion switches to native scrolling', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('PageDown')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500)
  await page.keyboard.press('Space')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1100)
  await page.keyboard.press('End')
  await expect(page.locator('html')).toHaveAttribute('data-chapter', 'contact')
  await page.keyboard.press('Home')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(3)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('html')).toHaveAttribute('data-string-scroll-mode', 'default')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'ABOUT', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-chapter', 'about')
})

test('touch devices keep native scrolling even with a wide viewport', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  await page.goto(baseURL ?? 'http://localhost:5173')
  await expect(page.locator('html')).toHaveAttribute('data-string-scroll-mode', 'default')
  await context.close()
})
