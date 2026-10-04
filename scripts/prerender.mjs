// Turns the client build into a crawlable static page and writes the SEO files
// that search engines, link previews and AI assistants read.
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const names = { verix: 'Verix', cex: 'CEX', tapguard: 'TapGuard Vault', smartmarket: 'SmartMarket' }
const knowsAbout = [
  'Go', 'Concurrency', 'Distributed systems', 'Microservices', 'Event-driven architecture',
  'PostgreSQL', 'Redis', 'Kafka', 'gRPC', 'WebSockets',
  'Solana', 'Rust', 'Anchor', 'Solidity', 'Smart contracts', 'DeFi', 'AI agents',
]

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }
const decode = text => text.replace(/&(amp|lt|gt|quot|#39);/g, (_, name) => entities[name])

export async function prerender({ base }) {
  const entry = pathToFileURL(resolve('dist-ssr/entry-server.js')).href
  const { render, profile, projects, systems } = await import(entry)
  const template = await readFile('dist/index.html', 'utf8')
  // index.html is the single source for the public address and the share card.
  const url = template.match(/<link rel="canonical" href="(https:\/\/[^"]+\/)"/)?.[1]
  if (!url) throw new Error('index.html needs <link rel="canonical" href="https://…/"> with a trailing slash')
  await checkShareCard(template, url)
  const title = decode(template.match(/<title>([^<]*)<\/title>/)[1])
  const description = decode(template.match(/<meta name="description" content="([^"]*)"/)[1])
  const today = new Date().toISOString().slice(0, 10)
  const assets = await readdir('dist/assets')
  const displayFont = assets.find(file => /^barlow-condensed-latin-600-normal-.+\.woff2$/.test(file))
  const projectName = project => names[project.id] ?? project.name

  const graph = structuredData({ url, title, description, today, profile, projects, projectName })
  const head = [
    // The hero name is the largest paint; fetch its face before CSS discovers it.
    displayFont && `<link rel="preload" href="${base}assets/${displayFont}" as="font" type="font/woff2" crossorigin />`,
    `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).map(line => `    ${line}\n`).join('')

  const root = '<div id="root"></div>'
  if (!template.includes(root) || !template.includes('</head>')) throw new Error('dist/index.html is missing #root or </head>')
  const page = template.replace('  </head>', `${head}  </head>`).replace(root, `<div id="root">${render()}</div>`)
  await writeFile('dist/index.html', page)

  await writeFile('dist/robots.txt', ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('sitemap.xml', url).href}`, ''].join('\n'))
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`)
  await writeFile('dist/llms.txt', llms({ url, profile, projects, systems, projectName }))
  await writeFile('dist/404.html', notFound({ base, profile, displayFont }))

  console.log(`prerendered ${url} (base ${base})`)
}

/** Social crawlers read only the static <head>; fail the build rather than ship a broken preview. */
async function checkShareCard(template, url) {
  const meta = key => template.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1]
  const required = ['og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:url',
    'og:type', 'og:site_name', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']
  const missing = required.filter(key => !meta(key))
  const problems = missing.length ? [`missing ${missing.join(', ')}`] : []
  const image = meta('og:image') ?? ''
  if (!image.startsWith(url)) problems.push(`og:image must be a full URL on ${url}, got "${image}"`)
  if (meta('twitter:image') !== image) problems.push('twitter:image must match og:image')
  if (meta('og:url') !== url) problems.push(`og:url must equal the canonical URL ${url}`)
  if (meta('og:image:width') !== '1200' || meta('og:image:height') !== '630') problems.push('og:image must be declared as 1200x630')
  if (meta('twitter:card') !== 'summary_large_image') problems.push('twitter:card must be summary_large_image')
  if (image.startsWith(url)) {
    const file = `dist/${image.slice(url.length)}`
    await stat(file).catch(() => problems.push(`${file} does not exist; add it to public/`))
  }
  if (problems.length) throw new Error(`Share card check failed:\n- ${problems.join('\n- ')}`)
}

function structuredData({ url, title, description, today, profile, projects, projectName }) {
  const id = fragment => url ? `${url}${fragment}` : fragment
  const person = {
    '@type': 'Person',
    '@id': id('#person'),
    name: profile.name,
    jobTitle: profile.role,
    description,
    email: `mailto:${profile.email}`,
    sameAs: [profile.github, profile.linkedin],
    knowsAbout,
    award: projects.filter(project => project.award).map(project => `${project.award} (${projectName(project)})`),
    ...(url && { url }),
  }
  const work = {
    '@type': 'ItemList',
    '@id': id('#work'),
    name: 'Selected work',
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': project.repo ? 'SoftwareSourceCode' : 'CreativeWork',
        name: projectName(project),
        headline: project.statement,
        description: project.description,
        keywords: project.stack.join(', '),
        author: { '@id': person['@id'] },
        ...(project.repo && { codeRepository: project.repo }),
        ...((project.demo || project.repo) && { url: project.demo || project.repo }),
        ...(project.award && { award: project.award }),
        ...(project.year && { dateCreated: project.year }),
        ...(url && { mainEntityOfPage: `${url}#${project.id}` }),
      },
    })),
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      { '@type': 'WebSite', '@id': id('#website'), name: title, description, inLanguage: 'en', publisher: { '@id': person['@id'] }, ...(url && { url }) },
      { '@type': 'ProfilePage', '@id': id('#profile'), name: title, description, inLanguage: 'en', dateModified: today, mainEntity: { '@id': person['@id'] }, hasPart: { '@id': work['@id'] }, ...(url && { url, isPartOf: { '@id': id('#website') } }) },
      work,
    ],
  }
}

/** A plain-language summary for AI assistants, following https://llmstxt.org. */
function llms({ url, profile, projects, systems, projectName }) {
  const lines = [
    `# ${profile.name}`,
    '',
    `> ${profile.role} working with Go, distributed systems and Web3. This file summarises the portfolio site "Inside the Runtime".`,
    '',
    `In ${profile.name}'s words: "${profile.summary}"`,
    '',
    '## Recognition',
    '',
    ...projects.filter(project => project.award).map(project => `- ${project.award} for ${projectName(project)}`),
    '',
    '## Projects',
    '',
  ]
  for (const project of projects) {
    const links = [project.repo && `[Source](${project.repo})`, project.demo && `[Showcase](${project.demo})`].filter(Boolean)
    lines.push(
      `### ${projectName(project)}: ${project.category}`,
      '',
      project.description,
      '',
      `- Problem: ${project.problem}`,
      `- Approach: ${project.solution}`,
      `- Outcome: ${project.outcomes}`,
      `- Stack: ${project.stack.join(', ')}`,
      ...(links.length ? [`- Links: ${links.join(' · ')}`] : []),
      '',
    )
  }
  lines.push('## Capabilities', '')
  for (const system of systems) lines.push(`- ${system.name[0]}${system.name.slice(1).toLowerCase()}: ${system.skills.join(', ')}`)
  lines.push(
    '',
    '## Contact',
    '',
    `- [Email](mailto:${profile.email})`,
    `- [GitHub](${profile.github})`,
    `- [LinkedIn](${profile.linkedin})`,
    ...(url ? [`- [Portfolio](${url})`] : []),
    '',
  )
  return lines.join('\n')
}

function notFound({ base, profile, displayFont }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta name="theme-color" content="#060708" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <title>Page not found | ${profile.name}</title>
    <style>
      ${displayFont ? `@font-face { font-family: Display; font-weight: 600; font-display: swap; src: url(${base}assets/${displayFont}) format('woff2'); }` : ''}
      body { margin: 0; min-height: 100svh; display: grid; place-items: center; background: #060708; color: #f2f1ed; font: 16px/1.6 system-ui, sans-serif; }
      main { padding: 24px; max-width: 720px; }
      p { font: 13px/1.6 ui-monospace, monospace; letter-spacing: .06em; color: #b7ff4a; margin: 0; }
      h1 { font: 600 clamp(56px, 12vw, 120px)/.92 Display, Impact, sans-serif; margin: 20px 0 36px; text-transform: uppercase; }
      a { display: inline-flex; gap: 14px; align-items: center; min-height: 48px; padding: 0 18px; background: #b7ff4a; color: #060708; font: 500 14px ui-monospace, monospace; text-decoration: none; }
      a:focus-visible { outline: 2px solid #f2f1ed; outline-offset: 4px; }
    </style>
  </head>
  <body>
    <main>
      <p>404 / ROUTE NOT FOUND</p>
      <h1>This path doesn't exist.</h1>
      <a href="${base}">BACK TO THE RUNTIME <span aria-hidden="true">↗</span></a>
    </main>
  </body>
</html>
`
}
