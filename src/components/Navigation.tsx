import { useEffect, useRef } from 'react'
import { runtime } from '../animation/runtime'
import { projects } from '../data/projects'
import { profile } from '../data/profile'
import { useMenuMotion } from '../animation/useMenuMotion'
import '../styles/navigation.css'

export function Navigation({ onIndex, open }: { onIndex: () => void; open: boolean }) {
  return <header className="site-header">
    <a className="wordmark" href="#home" aria-label="Srijit Gyawali, home"><span>S<span className="wordmark-g">G</span></span><span className="wordmark-dot" aria-hidden="true" /></a>
    <nav aria-label="Main navigation">
      <button className="menu-toggle" onClick={onIndex} data-cursor="OPEN" aria-haspopup="dialog" aria-expanded={open} aria-controls="navigation-menu">MENU <span className="menu-glyph" aria-hidden="true"><i /><i /><i /></span></button>
    </nav>
  </header>
}

export function NavigationMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useMenuMotion(ref, open, onClose)
  return <dialog ref={ref} id="navigation-menu" className="liquid-menu" data-liquid-menu aria-labelledby="navigation-menu-title" onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <svg className="menu-curtain" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H1000V1000H0Z" /></svg>
    <div className="menu-content">
      <header className="menu-header"><span className="menu-brand" aria-hidden="true">SG<span>INSIDE THE RUNTIME</span></span><button className="menu-close" onClick={() => close()} aria-label="Close navigation menu" autoFocus>CLOSE<span className="menu-glyph" aria-hidden="true"><i /><i /><i /></span></button></header>
      <h2 id="navigation-menu-title" className="sr-only">Explore the portfolio</h2>
      <nav className="menu-sections" aria-label="Portfolio sections">
        {[['home', 'HOME'], ['verix', 'PROJECTS'], ['about', 'ABOUT'], ['contact', 'CONTACT']].map(([id, label]) => <a key={id} href={`#${id}`} data-menu-reveal onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          close(id)
        }}><span>{label}</span><i aria-hidden="true" /></a>)}
      </nav>
      <div className="menu-social"><a href={profile.github} target="_blank" rel="noreferrer">GITHUB <span aria-hidden="true">↗</span></a><a href={profile.linkedin} target="_blank" rel="noreferrer">LINKEDIN <span aria-hidden="true">↗</span></a></div>
    </div>
  </dialog>
}

/** The work section retains its separate project index. */
export function ProjectIndex({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      runtime.preview = -1
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])
  return <dialog ref={ref} id="project-index" className="index-dialog" aria-labelledby="index-title" onCancel={onClose}>
      <div className="index-header"><h2 id="index-title">SELECTED WORK</h2><button className="dialog-close" onClick={onClose} aria-label="Close project index" autoFocus>CLOSE <span aria-hidden="true">×</span></button></div>
      <div className="index-list" onMouseLeave={() => { runtime.preview = -1 }}>
      {projects.map((project, index) => <a key={project.id} href={`#${project.id}`} onClick={onClose} onMouseEnter={() => { runtime.preview = index + 3 }} onFocus={() => { runtime.preview = index + 3 }} data-cursor="VIEW">
        <span className="index-number">{project.number}</span><span className="index-name">{project.name}</span><span className="index-meta">{project.category}<small>{project.year ? `${project.year} · ` : ''}{project.stack.slice(0, 3).join(' / ')}</small></span><span className="index-arrow" aria-hidden="true">↗</span>
      </a>)}
      </div>
  </dialog>
}
