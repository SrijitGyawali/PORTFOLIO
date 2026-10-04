import { useEffect, type RefObject } from 'react'
import { animate, createScope, stagger, type Scope } from 'animejs'

/** Anime owns the opening glyph assembly; StringTune owns repeatable scroll motion. */
export function useChoreography(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let scope: Scope | undefined
    let hasIntroduced = false

    const setup = () => {
      scope?.revert()
      scope = undefined
      if (motionQuery.matches || document.documentElement.dataset.motion === 'paused') return

      // Scoped opening animations revert cleanly when motion preferences change.
      // https://animejs.com/documentation/getting-started/using-with-react/
      scope = createScope({ root }).add((self) => {
        if (!self) return
        if (!hasIntroduced) {
          hasIntroduced = true
          const letters = root.querySelectorAll('.hero-letter')
          if (letters.length) {
            animate(letters, {
              // Deterministic offsets assemble individual glyphs into the grid;
              // each remains partly visible while its clipped strokes resolve.
              x: (_target: unknown, index = 0) => [((index * 7) % 9 - 4) * 4, 0],
              y: (_target: unknown, index = 0) => [24 + index % 3 * 8, 0],
              rotate: (_target: unknown, index = 0) => [index % 2 === 0 ? -3 : 3, 0],
              skewX: (_target: unknown, index = 0) => [(index % 3 - 1) * 9, 0],
              clipPath: ['inset(0% 0% 65% 0%)', 'inset(0% 0% 0% 0%)'],
              opacity: [0.32, 1],
              duration: 1100,
              delay: stagger(38, { from: 'center' }),
              ease: 'out(4)',
            })
          }
          const metadata = root.querySelectorAll('.hero-meta, [data-hero-meta], .hero-topline, .hero-role, .hero-bottom')
          if (metadata.length) {
            animate(metadata, {
              y: [8, 0],
              opacity: [0.6, 1],
              duration: 850,
              delay: stagger(60),
              ease: 'out(3)',
            })
          }
        }

      })
    }

    setup()
    motionQuery.addEventListener('change', setup)
    const motionObserver = new MutationObserver(setup)
    motionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-motion'],
    })

    return () => {
      motionObserver.disconnect()
      motionQuery.removeEventListener('change', setup)
      scope?.revert()
    }
  }, [rootRef])
}
