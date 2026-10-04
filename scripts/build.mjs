// Production build: the client bundle, a server render of the same App, then
// static HTML and SEO files written into dist/.
import { rm } from 'node:fs/promises'
import { build } from 'vite'
import { prerender } from './prerender.mjs'
import { resolveSite } from './site.mjs'

const site = resolveSite(process.argv.slice(2), process.env)

await build({ base: site.base })
await build({
  base: site.base,
  logLevel: 'warn',
  build: { ssr: 'src/entry-server.tsx', outDir: 'dist-ssr', emptyOutDir: true },
})
try {
  await prerender(site)
} finally {
  await rm('dist-ssr', { recursive: true, force: true })
}
