/**
 * Resolves the path the site is served from. The public address itself lives
 * in index.html (canonical link and og:url), so it is fixed in static HTML.
 *
 * The base path comes from --base= or BASE_PATH, for hosting under a sub-path
 * such as https://user.github.io/PORTFOLIO/. It defaults to the domain root.
 */
export function resolveSite(args = [], env = {}) {
  const flag = args.find(arg => arg.startsWith('--base='))?.slice('--base='.length)
  return { base: slashes(flag || env.BASE_PATH || '/') }
}

function slashes(path) {
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}
