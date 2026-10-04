import { useLayoutEffect, useRef, type RefObject } from 'react'

const clamp = (n: number) => Math.max(0, Math.min(1, n))
const ease = (n: number) => 1 - (1 - clamp(n)) ** 3

/** A finite, reversible timeline. Only the curtain path and compositor-friendly
 * transforms change; there are no layout reads or React updates per frame. */
export function useMenuMotion(dialogRef: RefObject<HTMLDialogElement | null>, open: boolean, onClose: () => void) {
  const closeRef = useRef<(destination?: string) => void>(() => {})
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => { onCloseRef.current = onClose }, [onClose])

  useLayoutEffect(() => {
    const element = dialogRef.current
    if (!element || !open) return
    const dialog: HTMLDialogElement = element
    const path = dialog.querySelector<SVGPathElement>('.menu-curtain path')!
    const links = Array.from(dialog.querySelectorAll<HTMLElement>('[data-menu-reveal]'))
    const social = dialog.querySelector<HTMLElement>('.menu-social')!
    const root = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    let frame = 0
    let progress = 0
    let target = 1
    let destination: string | undefined
    let finished = false
    const staticMotion = () => reduce.matches || root.dataset.motion === 'paused'

    function paint(value: number) {
      progress = value
      const p = ease(value)
      const y = -25 + p * 1025
      const wave = Math.sin(value * Math.PI) * 125
      const r = 18 * p
      path.setAttribute('d', value <= 0 ? 'M0 0H1000V0H0Z' : `M0 -10H1000V${y-r}Q1000 ${y} ${1000-r} ${y}C900 ${y} 900 ${y+wave} 750 ${y}S600 ${y-wave} 500 ${y}S350 ${y+wave} 250 ${y}S100 ${y-wave} ${r} ${y}Q0 ${y} 0 ${y-r}Z`)
      dialog.style.setProperty('--menu-shade', String(p * .24))
      dialog.style.setProperty('--menu-icon-turn', `${p * 90}deg`)
      for (let i = 0; i < links.length; i++) {
        const reveal = ease((value - .24 - i * .065) / .36)
        links[i].style.opacity = String(reveal)
        links[i].style.transform = `translate3d(0,${-48 * (1 - reveal)}px,0)`
      }
      const reveal = ease((value - .62) / .3)
      social.style.opacity = String(reveal)
      social.style.transform = `translate3d(0,${-18 * (1 - reveal)}px,0)`
    }

    function complete() {
      if (target === 1) { dialog!.dataset.menuState = 'open'; return }
      if (finished) return
      finished = true
      dialog!.close()
      onCloseRef.current()
      // React releases body overflow and restores focus before the scroll
      // controller records history and focuses the chosen section.
      if (destination) requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('portfolio:menu-navigate', { detail: destination }))
      })
    }

    function run(next: number) {
      cancelAnimationFrame(frame)
      target = next
      dialog!.dataset.menuState = next ? 'opening' : 'closing'
      if (staticMotion()) { paint(next); complete(); return }
      const from = progress
      const start = performance.now()
      const duration = (next ? 900 : 620) * Math.abs(next - from)
      const tick = (now: number) => {
        const t = duration ? clamp((now - start) / duration) : 1
        paint(from + (next - from) * t)
        if (t < 1) frame = requestAnimationFrame(tick)
        else complete()
      }
      frame = requestAnimationFrame(tick)
    }

    closeRef.current = (id?: string) => {
      if (target === 0 || finished) return
      destination = id
      run(0)
    }
    const settleMotion = () => {
      if (!staticMotion()) return
      cancelAnimationFrame(frame)
      paint(target)
      complete()
    }
    const motionObserver = new MutationObserver(settleMotion)
    motionObserver.observe(root, { attributes: true, attributeFilter: ['data-motion'] })
    reduce.addEventListener('change', settleMotion)
    paint(staticMotion() ? 1 : 0)
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    run(1)

    return () => {
      cancelAnimationFrame(frame)
      reduce.removeEventListener('change', settleMotion)
      motionObserver.disconnect()
      closeRef.current = () => {}
      dialog.close()
      document.body.style.overflow = overflow
      previous?.focus({ preventScroll: true })
      delete dialog.dataset.menuState
    }
  }, [dialogRef, open])

  return (destination?: string) => closeRef.current(destination)
}
