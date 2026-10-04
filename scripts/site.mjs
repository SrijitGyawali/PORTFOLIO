/**
 * Resolves where the site will be served. Absolute URLs (canonical, Open Graph
 * image, sitemap) are written only when the public address is known, so a
 * build never points search engines at a guessed domain.
 *
 * Order: SITE_URL, then Vercel's production domain, then Netlify's site URL.
 * The base path comes from --base=, BASE_PATH, or the SITE_URL path.
 */
export function resolveSite(args = [], env = {}) {
  const raw = env.SITE_URL
    || (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`)
    || (env.NETLIFY === 'true' && env.URL)
    || ''
  const url = raw ? new URL(raw.endsWith('/') ? raw : `${raw}/`) : undefined
  const flag = args.find(arg => arg.startsWith('--base='))?.slice('--base='.length)
  const base = slashes(flag || env.BASE_PATH || url?.pathname || '/')
  return { base, url: url?.href }
}

function slashes(path) {
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}
