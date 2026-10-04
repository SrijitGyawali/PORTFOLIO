import { expect, test } from '@playwright/test'

for (const width of [320, 390, 1440]) {
  test(`supporting content remains readable and contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const content: Array<[string, number]> = [
      ['.capability-panel > p', 17],
      ['.capability-panel li', 15],
      ['#tapguard .project-stack li', 15],
      ['#tapguard .project-flow li', 15],
      ['.about-copy > p', 18],
      ['.exploring li', 16],
      ['.copy-email', 13],
      ['.social-links a', 15],
    ]
    for (const [selector, minimum] of content) {
      const element = page.locator(selector).first()
      await element.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect.poll(() => element.evaluate(node => {
        let opacity = 1
        for (let parent: Element | null = node; parent; parent = parent.parentElement) opacity *= Number(getComputedStyle(parent).opacity)
        return opacity
      })).toBe(1)
      const metrics = await element.evaluate(node => {
        const rect = node.getBoundingClientRect()
        return { size: parseFloat(getComputedStyle(node).fontSize), left: rect.left, right: rect.right }
      })
      expect(metrics.size, selector).toBeGreaterThanOrEqual(minimum)
      expect(metrics.left, selector).toBeGreaterThanOrEqual(0)
      expect(metrics.right, selector).toBeLessThanOrEqual(width)
    }
    const index = page.getByRole('navigation').getByRole('button', { name: 'MENU' })
    await expect(index).toHaveCSS('font-size', '14px')
    expect((await index.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

test('engineering notes stay separate from technical panels on desktop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const id of ['verix', 'cex', 'tapguard', 'smartmarket']) {
      const chapter = page.locator(`#${id}`)
      const gap = await chapter.evaluate(node => node.querySelector('.project-footer')!.getBoundingClientRect().top - node.querySelector('.project-tech-note')!.getBoundingClientRect().bottom)
      expect(gap, `${id} at ${width}px`).toBeGreaterThanOrEqual(24)
    }
  }
})
