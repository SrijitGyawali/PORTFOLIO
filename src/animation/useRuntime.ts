import { useEffect } from 'react'
import StringTune from '@fiddle-digital/string-tune'
import { runtime, sceneSections } from './runtime'
import { createScrollChoreography } from './scrollChoreography'

let tune: StringTune | undefined

/** StringTune owns the page clock; React owns only its subscriptions. */
function getTune() {
  if (!tune) {
    tune = StringTune.getInstance()
    // One short, responsive easing tail; the engine still writes native scrollTop.
    // Verified against StringTune 1.2.6's public ScrollSettingsOptions.
    tune.scroll.configure({
      speed: 0.22, acceleration: 0.85, smoothness: 0.16,
      multiplier: 1.15, maxDelta: 1800, stopThreshold: 0.12,
    })
    tune.scrollDesktopMode = window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches ? 'default' : 'smooth'
    tune.scrollMobileMode = 'default'
    tune.start(60)
  }
  return tune
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const chapterNames = ['INITIALIZATION', 'PROOF OF WORK', 'CAPABILITIES', 'VERIX', 'CEX', 'TAPGUARD', 'SMARTMARKET', 'SYSTEMS', 'THE ENGINEER', 'LET’S CONNECT']

export function useRuntime(): void {
  useEffect(() => {
    const engine = getTune()
    const root = document.documentElement
    const choreography = createScrollChoreography(document.getElementById('root')!)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarseQuery = window.matchMedia('(pointer: coarse)')
    const chapters = sceneSections.map((id, index) => ({
      id,
      index,
      element: document.getElementById(id),
      top: 0,
    }))
    const progressNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-global-progress]'))
    const chapterNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-current-chapter]'))
    const navigationLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.site-header a[href^="#"], .menu-sections a[href^="#"]'))
    let range = 1
    let viewport = window.innerHeight
    let previousScroll = engine.scrollPosition
    let previousTime = performance.now()
    let lastChapter = -1
    let measureFrame = 0
    let navigateFrame = 0
    let historyFrame = 0
    let modalOpen = false
    let desktopMode = ''
    const isolatedDialogs = new Set<HTMLDialogElement>()
    const focusTargets = new Set<HTMLElement>()
    const previousScrollRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'

    const syncDialogs = () => {
      document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
        if (!dialog.hasAttribute('data-string-isolation')) {
          dialog.setAttribute('data-string-isolation', '')
          isolatedDialogs.add(dialog)
        }
      })
      const isOpen = Boolean(document.querySelector('dialog[open]'))
      if (isOpen && (!modalOpen || root.dataset.stringScrollMode !== 'disable')) {
        // Stop an in-flight page glide before making the background inert.
        engine.scrollPosition = window.scrollY
        engine.lockPageScroll()
      } else if (!isOpen && modalOpen) {
        engine.unlockPageScroll()
        engine.scrollPosition = window.scrollY
      }
      modalOpen = isOpen
    }

    const updateScene = () => {
      const position = runtime.scroll
      const startOf = (top: number) => Math.max(0, top - viewport * 0.22)
      let active = 0
      for (let index = 1; index < chapters.length; index += 1) {
        if (chapters[index].element && position >= startOf(chapters[index].top)) active = index
      }
      const current = chapters[active]
      const next = chapters[active + 1]
      const fraction = next
        ? clamp((position - startOf(current.top)) / Math.max(1, startOf(next.top) - startOf(current.top)))
        : 0
      runtime.scene = clamp(current.index + fraction, 0, sceneSections.length - 1)
      runtime.progress = clamp(runtime.scroll / range)
      root.style.setProperty('--hero-progress', String(clamp(runtime.scroll / Math.max(1, viewport))))
      // The name's DOM layer yields to the same glyphs in the persistent world.
      // Keeping this reversible also restores readable type in static modes.
      root.style.setProperty('--hero-fragment-progress', String(
        runtime.reducedMotion || runtime.paused ? 0 : clamp((runtime.scene - 0.06) / 0.22),
      ))

      for (const node of progressNodes) {
        node.style.transform = `scaleX(${runtime.progress})`
        node.dataset.progress = String(Math.round(runtime.progress * 100))
        if (node.getAttribute('role') === 'progressbar') {
          node.setAttribute('aria-valuenow', String(Math.round(runtime.progress * 100)))
        }
      }

      if (lastChapter !== active) {
        lastChapter = active
        const title = current.element?.dataset.chapter ?? `${String(active).padStart(2, '0')} / ${chapterNames[active]}`
        for (const node of chapterNodes) node.textContent = title
        root.dataset.chapter = current.id
        for (const link of navigationLinks) {
          const id = link.hash.slice(1)
          const isCurrent = id === current.id || id === 'verix' && active >= 3 && active <= 6
          if (isCurrent) link.setAttribute('aria-current', 'location')
          else link.removeAttribute('aria-current')
        }
      }
    }

    const measure = () => {
      measureFrame = 0
      viewport = window.innerHeight
      for (const chapter of chapters) {
        if (chapter.element) chapter.top = chapter.element.getBoundingClientRect().top + window.scrollY
      }
      engine.onResize(true)
      syncDialogs()
      range = Math.max(1, engine.scrollHeight - engine.containerHeight)
      runtime.scroll = engine.scrollPosition
      choreography.measure()
      updateScene()
      choreography.update(runtime.scroll, runtime.velocity, runtime.reducedMotion || runtime.paused)
    }
    const queueMeasure = () => {
      if (!measureFrame) measureFrame = requestAnimationFrame(measure)
    }

    // Public events carry numbers, not an event wrapper or private runtime state.
    // https://tune.fiddle.digital/docs/api/events/
    const onScroll = (position: number) => {
      runtime.scroll = position
      updateScene()
    }
    const onUpdate = () => {
      const now = performance.now()
      const elapsed = Math.max(8, now - previousTime)
      const delta = engine.scrollPosition - previousScroll
      const velocity = clamp(delta * (1000 / 60) / elapsed, -80, 80)
      runtime.velocity = runtime.reducedMotion || runtime.paused
        ? 0
        : runtime.velocity + (velocity - runtime.velocity) * 0.22
      if (Math.abs(runtime.velocity) < 0.001) runtime.velocity = 0
      previousScroll = engine.scrollPosition
      previousTime = now
      if (runtime.visible) choreography.update(runtime.scroll, runtime.velocity, runtime.reducedMotion || runtime.paused)
    }
    const syncMotion = () => {
      runtime.reducedMotion = motionQuery.matches
      runtime.paused = root.dataset.motion === 'paused'
      root.dataset.reducedMotion = String(motionQuery.matches)
      const nextMode = motionQuery.matches || coarseQuery.matches || runtime.paused ? 'default' : 'smooth'
      if (desktopMode !== nextMode) {
        desktopMode = nextMode
        engine.scrollPosition = window.scrollY
        engine.scrollDesktopMode = nextMode
        syncDialogs()
      }
      if (runtime.reducedMotion || runtime.paused) {
        runtime.velocity = 0
        runtime.pointer.x = 0
        runtime.pointer.y = 0
      }
      updateScene()
      choreography.update(runtime.scroll, runtime.velocity, runtime.reducedMotion || runtime.paused)
    }

    const navigate = (id: string, immediate = false) => {
      const target = document.getElementById(id)
      if (!target) return
      if (navigateFrame) cancelAnimationFrame(navigateFrame)
      // Let React close an index dialog and restore body overflow before scrolling.
      navigateFrame = requestAnimationFrame(() => {
        navigateFrame = 0
        syncDialogs()
        engine.onResize(true)
        const distance = Math.abs(target.getBoundingClientRect().top - 88)
        engine.scrollTo({
          selector: `#${CSS.escape(id)}`,
          offset: id === 'home' ? 0 : -88,
          immediate: immediate || runtime.reducedMotion || runtime.paused || coarseQuery.matches || window.innerWidth < 1024,
          duration: clamp(420 + distance * 0.035, 420, 780),
        })
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1')
          focusTargets.add(target)
        }
        target.focus({ preventScroll: true })
      })
    }

    const visitSection = (id: string) => {
      const hash = `#${id}`
      history.replaceState({ ...history.state, portfolioScroll: window.scrollY }, '')
      if (hash !== location.hash) history.pushState({ portfolioSection: id }, '', hash)
      navigate(id)
    }
    const onMenuNavigate = (event: Event) => {
      const id = (event as CustomEvent<unknown>).detail
      if (typeof id === 'string' && document.getElementById(id)) visitSection(id)
    }
    const onAnchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!anchor || anchor.hasAttribute('download') || anchor.target && anchor.target !== '_self') return
      // Menu links wait until the reverse curtain finishes before navigating.
      if (anchor.closest('[data-liquid-menu]')) return
      const url = new URL(anchor.href, location.href)
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return
      let id: string
      try { id = decodeURIComponent(url.hash.slice(1)) } catch { return }
      if (!document.getElementById(id)) return
      event.preventDefault()
      visitSection(id)
    }

    const restoreHistory = () => {
      if (historyFrame) cancelAnimationFrame(historyFrame)
      historyFrame = requestAnimationFrame(() => {
        historyFrame = 0
        const saved = history.state?.portfolioScroll
        if (typeof saved === 'number') {
          engine.scrollTo({ position: saved, immediate: true })
        } else if (location.hash) {
          try { navigate(decodeURIComponent(location.hash.slice(1)), true) } catch { /* Malformed external hash. */ }
        } else {
          engine.scrollTo({ position: 0, immediate: true })
        }
      })
    }
    const preserveControlKeys = (event: KeyboardEvent) => {
      if (![' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return
      const target = event.target
      if (target instanceof Element && target.closest('button, input, textarea, select, summary, [contenteditable], [role="button"], [role="tab"], [role="slider"], [role="spinbutton"]')) {
        // StringTune's window key handler excludes inputs but not buttons.
        // React has already received this bubbling event; preserve the browser's
        // Space activation without allowing the page controller to cancel it.
        event.stopPropagation()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (runtime.reducedMotion || runtime.paused || event.pointerType === 'touch') return
      runtime.pointer.x = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1)
      runtime.pointer.y = clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1)
    }
    const resetPointer = () => {
      runtime.pointer.x = 0
      runtime.pointer.y = 0
    }
    const onVisibility = () => {
      runtime.visible = document.visibilityState !== 'hidden'
      previousTime = performance.now()
      previousScroll = engine.scrollPosition
      runtime.velocity = 0
    }

    engine.on('scroll', onScroll)
    engine.on('update', onUpdate)
    motionQuery.addEventListener('change', syncMotion)
    coarseQuery.addEventListener('change', syncMotion)
    document.addEventListener('click', onAnchor, true)
    document.addEventListener('portfolio:menu-navigate', onMenuNavigate)
    document.addEventListener('keydown', preserveControlKeys)
    window.addEventListener('popstate', restoreHistory)
    window.addEventListener('hashchange', restoreHistory)
    window.addEventListener('resize', queueMeasure, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('blur', resetPointer)
    document.documentElement.addEventListener('pointerleave', resetPointer)
    document.addEventListener('visibilitychange', onVisibility)
    const resizeObserver = new ResizeObserver(queueMeasure)
    resizeObserver.observe(document.body)
    const motionObserver = new MutationObserver(syncMotion)
    motionObserver.observe(root, { attributes: true, attributeFilter: ['data-motion'] })
    const dialogObserver = new MutationObserver((records) => {
      syncDialogs()
      if (records.some(record => record.type === 'childList' && record.target instanceof Element && record.target.closest('main'))) queueMeasure()
    })
    dialogObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
    // StringTune's layout rebuild may restore its responsive mode; reapply a
    // modal lock only when the mode actually changes, without a frame-loop reset.
    dialogObserver.observe(root, { attributes: true, attributeFilter: ['data-string-scroll-mode'] })
    let mounted = true
    void document.fonts.ready.then(() => { if (mounted) queueMeasure() })
    syncMotion()
    onVisibility()
    measure()

    return () => {
      mounted = false
      if (measureFrame) cancelAnimationFrame(measureFrame)
      if (navigateFrame) cancelAnimationFrame(navigateFrame)
      if (historyFrame) cancelAnimationFrame(historyFrame)
      resizeObserver.disconnect()
      motionObserver.disconnect()
      dialogObserver.disconnect()
      choreography.destroy()
      if (modalOpen) engine.unlockPageScroll()
      isolatedDialogs.forEach(dialog => dialog.removeAttribute('data-string-isolation'))
      focusTargets.forEach(target => target.removeAttribute('tabindex'))
      history.scrollRestoration = previousScrollRestoration
      engine.off('scroll', onScroll)
      engine.off('update', onUpdate)
      motionQuery.removeEventListener('change', syncMotion)
      coarseQuery.removeEventListener('change', syncMotion)
      document.removeEventListener('click', onAnchor, true)
      document.removeEventListener('portfolio:menu-navigate', onMenuNavigate)
      document.removeEventListener('keydown', preserveControlKeys)
      window.removeEventListener('popstate', restoreHistory)
      window.removeEventListener('hashchange', restoreHistory)
      window.removeEventListener('resize', queueMeasure)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('blur', resetPointer)
      document.documentElement.removeEventListener('pointerleave', resetPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      // destroy() does not reset StringTune's singleton; keep its one app-lifetime
      // engine alive through React StrictMode's effect setup/cleanup replay.
    }
  }, [])
}
