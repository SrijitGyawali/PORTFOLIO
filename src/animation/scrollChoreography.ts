import { scrollMotion, type MotionOptions, type MotionPreset } from './scrollMotion'

type Target = { element: HTMLElement; top: number; height: number; options: MotionOptions; signature: string }
const presets: Array<[string, MotionPreset, number, number]> = [
  ['.section-top', 'line', 0, 0],
  ['.section-top > *, .project-number, .scene-counter, .record-label, .contact-intro', 'meta', 16, 0],
  ['main h2', 'title', 108, -34],
  ['.achievement-event, .achievement-result', 'panel', 24, 18],
  ['.achievement-row > a, .capability-tabs > button', 'item', 16, 10],
  ['.capability-panel > .eyebrow, .capability-panel h3, .capability-panel > p, .capability-panel li', 'item', 16, 8],
  ['.work-intro > .eyebrow, .work-intro > button', 'meta', 18, 8],
  ['.project-statement, .project-description, .project-open', 'body', 18, 0],
  ['.project-tech-note', 'panel', -24, 14],
  ['.project-stack, .project-flow, .project-award', 'meta', 16, 8],
  ['.systems-heading > p, .architecture-footer > *', 'body', 18, 8],
  ['.architecture-ingress > .arch-node, .architecture-ingress > button, .arch-branch', 'panel', 18, 0],
  ['.about-copy > :not(.exploring), .exploring > *', 'body', -18, 8],
  ['.email-block, .social-links > a, .contact footer > *', 'item', 18, 8],
  ['.hero-role, .hero-bottom > *, .world-caption', 'body', -18, 0],
  ['.environment-word', 'ghost', 260, 140],
]
const variables = ['--scroll-x', '--scroll-y', '--scroll-rotate', '--scroll-scale', '--scroll-opacity', '--reveal-progress', '--scroll-skew']

function layoutTop(element: HTMLElement) {
  let top = 0
  let current: HTMLElement | null = element
  while (current) { top += current.offsetTop; current = current.offsetParent as HTMLElement | null }
  return top
}

/** Uses StringTune's clock. Layout is measured only on resize/content changes. */
export function createScrollChoreography(root: HTMLElement) {
  const owned = new Set<HTMLElement>()
  const targets: Target[] = []
  let viewport = window.innerHeight
  let compact = window.innerWidth < 768
  let wasStatic = false

  function discover() {
    for (const [selector, preset, depth, shift] of presets) {
      root.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
        if (owned.has(element) || element.closest('dialog')) return
        element.dataset.scroll = preset
        owned.add(element)
        targets.push({ element, top: 0, height: 0, signature: '', options: { preset, depth, shift: index % 2 ? -shift : shift, stagger: preset === 'item' || preset === 'meta' || preset === 'panel' ? index % 3 : 0, compact } })
      })
    }
  }

  function measure() {
    viewport = window.innerHeight
    compact = window.innerWidth < 768
    discover()
    for (let index = targets.length - 1; index >= 0; index--) {
      if (!targets[index].element.isConnected) { owned.delete(targets[index].element); targets.splice(index, 1) }
    }
    for (const target of targets) {
      target.top = layoutTop(target.element)
      target.height = target.element.offsetHeight
      target.options.compact = compact
      target.signature = ''
    }
  }

  function reset(target: Target) {
    for (const name of variables) target.element.style.removeProperty(name)
    target.element.removeAttribute('data-scroll-active')
    target.signature = ''
  }

  function update(scroll: number, velocity: number, staticMotion: boolean) {
    if (staticMotion) {
      if (!wasStatic) targets.forEach(reset)
      wasStatic = true
      return
    }
    wasStatic = false
    for (const target of targets) {
      if (!target.element.isConnected) continue
      const relative = target.top - scroll
      const visible = relative < viewport * 1.2 && relative + target.height > -viewport * .3
      if (!visible) {
        if (target.element.hasAttribute('data-scroll-active')) target.element.removeAttribute('data-scroll-active')
        continue
      }
      const value = scrollMotion(target.top, target.height, viewport, scroll, velocity, target.options)
      const values = [value.x.toFixed(2) + 'px', value.y.toFixed(2) + 'px', value.rotate.toFixed(3) + 'deg', value.scale.toFixed(4), value.opacity.toFixed(3), value.reveal.toFixed(4), value.skew.toFixed(3) + 'deg']
      const signature = values.join('|')
      if (signature === target.signature) continue
      target.signature = signature
      for (let i = 0; i < variables.length; i++) target.element.style.setProperty(variables[i], values[i])
      target.element.setAttribute('data-scroll-active', '')
    }
  }

  measure()
  return { measure, update, destroy() { targets.forEach(reset); owned.forEach(element => element.removeAttribute('data-scroll')); targets.length = 0 } }
}
