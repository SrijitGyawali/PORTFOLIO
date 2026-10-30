import { useEffect, type RefObject } from 'react'

/** Local card effects: CSS owns the text loop, one finite RAF follows the pointer. */
export function useProjectEffects(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = ref.current
    if (!section) return
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const entries = Array.from(section.querySelectorAll<HTMLElement>('.project-entry'))
    const visible = new Set<Element>()
    const staticMotion = () => reduce.matches || root.dataset.motion === 'paused'
    const syncVisibility = () => {
      for (const entry of entries) entry.dataset.effectsVisible = String(!document.hidden && visible.has(entry))
    }
    const observer = new IntersectionObserver(records => {
      for (const record of records) {
        if (record.isIntersecting) visible.add(record.target)
        else visible.delete(record.target)
      }
      syncVisibility()
    })
    entries.forEach(entry => observer.observe(entry))

    const panels = entries.map(entry => {
      const panel = entry.querySelector<HTMLElement>('.project-card-body')!
      const glow = panel.querySelector<HTMLElement>('.project-card-glow')!
      let frame = 0
      let active = false
      let x = 0, y = 0, targetX = 0, targetY = 0, lastTime = 0

      const reset = () => {
        active = false
        cancelAnimationFrame(frame)
        frame = 0
        delete panel.dataset.glowActive
      }
      const tick = (now: number) => {
        frame = 0
        if (!active || staticMotion() || document.hidden) { reset(); return }
        // A busy frame's timestamp can predate the pointer event that started it.
        const ease = 1 - Math.exp(-Math.max(0, Math.min(64, now - lastTime)) / 65)
        lastTime = now
        x += (targetX - x) * ease
        y += (targetY - y) * ease
        glow.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
        if (Math.abs(targetX - x) + Math.abs(targetY - y) > .15) frame = requestAnimationFrame(tick)
      }
      const move = (event: PointerEvent) => {
        if (event.pointerType === 'touch' || !pointer.matches || staticMotion()) return
        const bounds = panel.getBoundingClientRect()
        if (!bounds.width || !bounds.height) return
        // Convert viewport coordinates to panel coordinates, even as the stack scales.
        targetX = Math.max(0, Math.min(panel.offsetWidth, (event.clientX - bounds.left) * panel.offsetWidth / bounds.width))
        targetY = Math.max(0, Math.min(panel.offsetHeight, (event.clientY - bounds.top) * panel.offsetHeight / bounds.height))
        if (!active) {
          x = targetX
          y = targetY
          glow.style.transform = `translate3d(${x}px, ${y}px, 0)`
          active = true
          panel.dataset.glowActive = 'true'
        }
        if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(tick) }
      }
      panel.addEventListener('pointerenter', move)
      panel.addEventListener('pointermove', move, { passive: true })
      panel.addEventListener('pointerleave', reset)
      panel.addEventListener('pointercancel', reset)
      return { reset, destroy() {
        reset()
        glow.style.removeProperty('transform')
        panel.removeEventListener('pointerenter', move)
        panel.removeEventListener('pointermove', move)
        panel.removeEventListener('pointerleave', reset)
        panel.removeEventListener('pointercancel', reset)
      } }
    })
    const syncMotion = () => {
      syncVisibility()
      if (staticMotion() || document.hidden || !pointer.matches) panels.forEach(panel => panel.reset())
    }
    const motionObserver = new MutationObserver(syncMotion)
    motionObserver.observe(root, { attributes: true, attributeFilter: ['data-motion'] })
    reduce.addEventListener('change', syncMotion)
    pointer.addEventListener('change', syncMotion)
    document.addEventListener('visibilitychange', syncMotion)
    const blur = () => panels.forEach(panel => panel.reset())
    window.addEventListener('blur', blur)
    return () => {
      observer.disconnect()
      motionObserver.disconnect()
      panels.forEach(panel => panel.destroy())
      entries.forEach(entry => delete entry.dataset.effectsVisible)
      reduce.removeEventListener('change', syncMotion)
      pointer.removeEventListener('change', syncMotion)
      document.removeEventListener('visibilitychange', syncMotion)
      window.removeEventListener('blur', blur)
    }
  }, [ref])
}
