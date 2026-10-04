import { expect, test } from '@playwright/test'

test('every chapter has scroll layers and parallax retraces on reverse scrolling', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scroll="title"]')).toHaveCount(10)
  const heading = page.locator('#cex-title')
  const origin = await page.locator('#cex').evaluate(node => node.getBoundingClientRect().top + window.scrollY)
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), origin - 320)
  await expect.poll(() => heading.evaluate(node => node.style.getPropertyValue('--scroll-y'))).not.toBe('')
  const before = await heading.evaluate(node => node.style.getPropertyValue('--scroll-y'))
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), origin - 140)
  await expect.poll(() => heading.evaluate(node => node.style.getPropertyValue('--scroll-y'))).not.toBe(before)
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), origin - 320)
  await expect.poll(() => heading.evaluate(node => node.style.getPropertyValue('--scroll-y'))).toBe(before)
  for (const id of ['proof', 'capabilities', 'verix', 'cex', 'tapguard', 'smartmarket', 'systems', 'about', 'contact']) {
    expect(await page.locator(`#${id} [data-scroll]`).count()).toBeGreaterThan(4)
  }
})

test('pause and reduced motion clear parallax without hiding content', async ({ page }) => {
  await page.goto('/#cex')
  const heading = page.locator('#cex-title')
  await expect(heading).toHaveAttribute('data-scroll', 'title')
  await page.getByRole('button', { name: 'Pause ambient animation' }).click()
  await expect(heading).toHaveCSS('translate', /^(none|0px(?: 0px)?)$/)
  await expect(heading).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Resume ambient animation' }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(heading).toHaveCSS('translate', /^(none|0px(?: 0px)?)$/)
  await expect(heading).toHaveCSS('opacity', '1')
})
