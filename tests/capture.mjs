import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('.runtime/preview', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const settle = () => page.evaluate(() => new Promise(resolve => {
  let frames = 0
  const tick = () => { if (++frames >= 40) resolve(); else requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
}))
await page.goto('http://localhost:5173/')
await page.evaluate(() => document.fonts.ready)
await page.waitForSelector('.webgl-world[data-webgl="ready"]')
await page.waitForFunction(() => [...document.querySelectorAll('.hero-letter')].every(letter => getComputedStyle(letter).opacity === '1'))
await settle()
await page.screenshot({ path: '.runtime/preview/hero-desktop.png' })
for (const id of ['cex', 'tapguard']) {
  await page.locator(`#${id}`).evaluate(node => node.scrollIntoView({ behavior: 'instant' }))
  await settle()
  await page.screenshot({ path: `.runtime/preview/${id}-desktop.png` })
}
const performanceSample = await page.evaluate(() => new Promise(resolve => {
  const frames = []; let previous = performance.now()
  const tick = now => { frames.push(now - previous); previous = now; if (frames.length < 120) requestAnimationFrame(tick); else { const measured = frames.slice(1).sort((a,b) => a-b); resolve({ medianFrameMs: measured[Math.floor(measured.length*.5)], p95FrameMs: measured[Math.floor(measured.length*.95)], framesOver34ms: measured.filter(time => time>34).length }) } }
  requestAnimationFrame(tick)
}))
console.log(JSON.stringify({ desktopFrameSample: performanceSample }))
await page.close()
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
await mobile.goto('http://localhost:5173/')
await mobile.evaluate(() => document.fonts.ready)
await mobile.waitForSelector('.webgl-world[data-webgl="ready"]')
await mobile.waitForFunction(() => [...document.querySelectorAll('.hero-letter')].every(letter => getComputedStyle(letter).opacity === '1'))
await mobile.screenshot({ path: '.runtime/preview/hero-mobile.png' })
for (const id of ['tapguard', 'contact']) {
  await mobile.locator(`#${id}`).evaluate(node => node.scrollIntoView({ behavior: 'instant' }))
  await mobile.evaluate(() => new Promise(resolve => { let n=0; const tick=()=>{if(++n>=40)resolve();else requestAnimationFrame(tick)};requestAnimationFrame(tick) }))
  await mobile.screenshot({ path: `.runtime/preview/${id}-mobile.png` })
}
await browser.close()
