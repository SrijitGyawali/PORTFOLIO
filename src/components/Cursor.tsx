import { useEffect, useRef } from 'react'

export default function Cursor() {
  const cursor = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = cursor.current
    const media = window.matchMedia('(pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)')
    if (!element) return
    let enabled = media.matches
    const updateMedia = () => { enabled = media.matches; element.style.opacity = '0'; document.documentElement.classList.toggle('has-cursor', enabled) }
    updateMedia()
    const move = (event: PointerEvent) => {
      if (!enabled || event.pointerType === 'touch') return
      element.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`
      element.style.opacity = '1'
      const target = (event.target as Element).closest<HTMLElement>('a, button, [data-cursor]')
      element.dataset.active = String(Boolean(target))
      const text = target?.dataset.cursor || (target?.tagName === 'A' && target.getAttribute('href')?.startsWith('https') ? 'OPEN ↗' : '')
      const label = element.querySelector('span')
      if (label) label.textContent = text
    }
    const hide = () => { element.style.opacity = '0' }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)
    media.addEventListener('change', updateMedia)
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', hide); window.removeEventListener('blur', hide); media.removeEventListener('change', updateMedia); document.documentElement.classList.remove('has-cursor') }
  }, [])
  return <div ref={cursor} className="cursor" aria-hidden="true"><i /><span /></div>
}
