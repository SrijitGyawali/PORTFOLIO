const clamp = (n: number) => Math.max(0, Math.min(1, n))

/** Flow markers stay measurable after the associated cards become sticky. */
export function projectAnchor(id: string): HTMLElement | null {
  return document.getElementById(`${id}-start`) ?? document.getElementById(id)
}

export function projectPin(entry: HTMLElement): number {
  const style = getComputedStyle(entry)
  return parseFloat(style.getPropertyValue('--stack-start'))
    + parseFloat(style.getPropertyValue('--project-index')) * parseFloat(style.getPropertyValue('--stack-step'))
}

/** One scroll clock for the whole page; no component render or layout read per frame. */
export function createProjectStack(root: HTMLElement) {
  const deck = root.querySelector<HTMLElement>('.project-deck')
  const entries = Array.from(root.querySelectorAll<HTMLElement>('.project-entry')).map(entry => ({
    entry,
    card: entry.querySelector<HTMLElement>('.project-card')!,
    marker: projectAnchor(entry.id)!,
    top: 0, pinned: 0, height: 0, signature: '',
  }))
  let viewport = window.innerHeight
  let fits = false

  function measure() {
    viewport = window.innerHeight
    // CSS defines the pin positions, including the smaller mobile offset.
    for (const item of entries) {
      item.top = item.marker.getBoundingClientRect().top + window.scrollY
      item.height = item.entry.offsetHeight
      item.pinned = projectPin(item.entry)
      item.signature = ''
    }
    fits = entries.every(item => item.height + item.pinned + 48 <= viewport)
    if (deck) deck.dataset.stack = fits ? 'enabled' : 'flow'
  }

  function update(scroll: number, staticMotion: boolean) {
    entries.forEach((item, index) => {
      const next = entries[index + 1]
      const travel = item.height * .8
      const cover = !staticMotion && fits && next ? clamp(1 - (next.top - scroll - next.pinned) / travel) : 0
      const pass = staticMotion ? .5 : clamp((scroll + viewport - item.top) / (viewport + item.height))
      const scale = (1 - cover * .045).toFixed(4)
      const shade = (cover * .38).toFixed(3)
      const drift = ((pass - .5) * -64).toFixed(2)
      const signature = `${scale}|${shade}|${drift}`
      if (signature === item.signature) return
      item.signature = signature
      item.card.style.setProperty('--card-scale', scale)
      item.card.style.setProperty('--card-shade', shade)
      item.card.style.setProperty('--art-drift', `${drift}px`)
    })
  }

  return { measure, update, destroy() {
    if (deck) delete deck.dataset.stack
    entries.forEach(({ card }) => {
      for (const property of ['--card-scale', '--card-shade', '--art-drift']) card.style.removeProperty(property)
    })
  } }
}
