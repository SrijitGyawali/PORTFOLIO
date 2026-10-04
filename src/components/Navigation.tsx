import { useEffect, useRef } from 'react'
import { runtime } from '../animation/runtime'
import { projects } from '../data/projects'
import '../styles/navigation.css'

export function Navigation({ onIndex }: { onIndex: () => void }) {
  return <header className="site-header">
    <a className="wordmark" href="#home" aria-label="Srijit Gyawali, home"><span>S<span className="wordmark-g">G</span></span><span className="wordmark-dot" aria-hidden="true" /></a>
    <a className="header-identity" href="#home">SRIJIT GYAWALI<span>BACKEND ENGINEER</span></a>
    <nav aria-label="Main navigation">
      <button onClick={onIndex} data-cursor="VIEW" aria-haspopup="dialog" aria-controls="project-index">INDEX <span className="index-icon" aria-hidden="true">＋</span></button>
      <a href="#verix">WORK</a><a href="#about">ABOUT</a><a href="#contact" className="contact-nav">LET’S TALK <span aria-hidden="true">↗</span></a>
    </nav>
  </header>
}

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
  return <dialog ref={ref} id="project-index" className="index-dialog" aria-labelledby="index-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="index-header"><span className="eyebrow">SELECTED WORK</span><button className="dialog-close" onClick={onClose} aria-label="Close project index">CLOSE <span aria-hidden="true">×</span></button></div>
    <h2 id="index-title">THE INDEX<span>04 PROJECTS</span></h2>
    <p className="index-intro">Choose a system to explore.</p>
    <div className="index-list" onMouseLeave={() => { runtime.preview = -1 }}>
      {projects.map((project, index) => <a key={project.id} href={`#${project.id}`} onClick={onClose} onMouseEnter={() => { runtime.preview = index + 3 }} onFocus={() => { runtime.preview = index + 3 }} data-cursor="VIEW">
        <span className="index-number">{project.number}</span><span className="index-name">{project.name}</span><span className="index-meta">{project.category}<small>{project.year ? `${project.year} · ` : ''}{project.stack.slice(0, 3).join(' / ')}</small></span><span className="index-arrow" aria-hidden="true">↗</span>
      </a>)}
    </div>
    <p className="index-note">FOUR DIFFERENT PROBLEMS. ONE SYSTEMS MINDSET.</p>
  </dialog>
}
