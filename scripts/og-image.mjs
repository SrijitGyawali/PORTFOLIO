// Renders the 1200x630 social share card to public/og.png.
// Run: node scripts/og-image.mjs (uses the installed Google Chrome via Playwright).
import { readFile, stat } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const WIDTH = 1200
const HEIGHT = 630
const MAX_BYTES = 300 * 1024
const output = 'public/og.png'

const font = async path => (await readFile(`node_modules/@fontsource/${path}`)).toString('base64')
const display = await font('barlow-condensed/files/barlow-condensed-latin-600-normal.woff2')
const mono = await font('ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')

// Same palette and type as the site: ink, paper, signal green, Barlow Condensed and IBM Plex Mono.
const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Display; font-weight: 600; src: url(data:font/woff2;base64,${display}) format('woff2'); }
  @font-face { font-family: Mono; font-weight: 400; src: url(data:font/woff2;base64,${mono}) format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #060708; color: #f2f1ed; }
  .card { position: relative; width: 100%; height: 100%; }
  .grid { position: absolute; inset: 0;
    background-image: linear-gradient(#e4ead512 1px, transparent 1px), linear-gradient(90deg, #e4ead512 1px, transparent 1px);
    background-size: 60px 60px; background-position: center;
    mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, transparent 30%, #000 85%); }
  .glow { position: absolute; inset: 0; background: radial-gradient(ellipse 45% 55% at 50% 52%, #b7ff4a10, transparent 70%); }
  .mark { position: absolute; top: 44px; left: 52px; display: grid; place-items: center; width: 62px; height: 64px;
    border: 1px solid #3a443c; font: 600 36px/1 Display; letter-spacing: -2px; }
  .mark b { font-weight: 600; }
  .mark span { color: #b7ff4a; }
  .mark i { position: absolute; top: 7px; right: 6px; width: 5px; height: 5px; background: #b7ff4a; }
  .domain { position: absolute; top: 66px; right: 56px; font: 400 17px/1 Mono; letter-spacing: .14em; color: #b8c0b7; }
  main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 18px; }
  h1 { font: 600 170px/.86 Display; letter-spacing: -.005em; text-align: center; text-transform: uppercase; }
  h1 span { display: block; }
  .role { display: flex; align-items: center; gap: 22px; margin-top: 40px; font: 400 25px/1 Mono; letter-spacing: .22em; color: #b7ff4a; }
  .role i { width: 9px; height: 9px; background: #b7ff4a; }
  .corner { position: absolute; width: 22px; height: 22px; border-color: #bcc2b466; border-style: solid; border-width: 0; }
  .tl { top: 24px; left: 24px; border-top-width: 1px; border-left-width: 1px; }
  .tr { top: 24px; right: 24px; border-top-width: 1px; border-right-width: 1px; }
  .bl { bottom: 24px; left: 24px; border-bottom-width: 1px; border-left-width: 1px; }
  .br { bottom: 24px; right: 24px; border-bottom-width: 1px; border-right-width: 1px; }
  .rule { position: absolute; left: 52px; right: 52px; bottom: 64px; height: 1px; background: #2b2e2e; }
  .rule::before { content: ''; position: absolute; left: 0; top: -1px; width: 56px; height: 3px; background: #b7ff4a; }
</style></head>
<body><div class="card">
  <div class="grid"></div><div class="glow"></div>
  <div class="mark"><b>S<span>G</span></b><i></i></div>
  <div class="domain">SRIJITGYAWALI.COM.NP</div>
  <main><h1><span>Srijit</span><span>Gyawali</span></h1><p class="role"><i></i>BACKEND ENGINEER<i></i></p></main>
  <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
  <div class="rule"></div>
</div></body></html>`

const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })
  await page.setContent(html)
  await page.evaluate(() => document.fonts.ready)
  const fontsLoaded = await page.evaluate(() => document.fonts.check('600 170px Display') && document.fonts.check('400 25px Mono'))
  if (!fontsLoaded) throw new Error('Share card fonts failed to load')
  // WhatsApp may show a square crop from the centre; keep the name inside it.
  const nameWidth = await page.locator('h1').evaluate(node => Math.max(...[...node.children].map(line => {
    const range = document.createRange(); range.selectNodeContents(line); return range.getBoundingClientRect().width
  })))
  if (nameWidth > HEIGHT - 40) throw new Error(`Name is ${Math.round(nameWidth)}px wide; it must fit a ${HEIGHT}px square crop`)
  await page.screenshot({ path: output, type: 'png' })
  const { size } = await stat(output)
  if (size > MAX_BYTES) throw new Error(`${output} is ${Math.round(size / 1024)} KB; the limit is 300 KB`)
  console.log(`${output}: ${WIDTH}x${HEIGHT}, ${Math.round(size / 1024)} KB, widest name line ${Math.round(nameWidth)}px`)
} finally {
  await browser.close()
}
