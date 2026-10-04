import { useEffect, useRef } from 'react'
import type { Project } from '../data/projects'

type ProjectDetailProps = {
  project: Project | null
  onClose: () => void
}

/** The native modal supplies focus containment and makes the page behind it inert. */
export default function ProjectDetail({ project, onClose }: ProjectDetailProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!project || !dialog) return

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!dialog.open) dialog.showModal()
    dialog.scrollTop = 0
    titleRef.current?.focus({ preventScroll: true })

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [project])

  if (!project) return null

  return (
    <dialog
      ref={dialogRef}
      className="project-dialog"
      aria-labelledby="project-detail-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        ) onClose()
      }}
    >
      <div className="dialog-header">
        <span className="detail-eyebrow">SYSTEM RECORD / {project.number}</span>
        <button className="dialog-close" onClick={onClose} aria-label="Close project details">
          CLOSE <span aria-hidden="true">×</span>
        </button>
      </div>

      <article className="dialog-body">
        <p className="detail-eyebrow">{project.category}{project.year ? ` / ${project.year}` : ''}</p>
        <h2 id="project-detail-title" className="detail-title" tabIndex={-1} ref={titleRef}>
          {project.name}
        </h2>
        <p className="detail-lead">{project.statement}</p>
        {project.award && <p className="detail-award">{project.award}</p>}

        <div className="detail-grid">
          <section aria-labelledby="project-overview-title">
            <h3 id="project-overview-title">Overview</h3>
            <p>{project.description}</p>
          </section>
          <section aria-labelledby="project-problem-title">
            <h3 id="project-problem-title">The problem</h3>
            <p>{project.problem}</p>
          </section>
        </div>

        <section className="detail-architecture" aria-labelledby="project-architecture-title">
          <h3 id="project-architecture-title">Architecture / data flow</h3>
          <ol className="detail-flow">
            {project.flow.map((stage, index) => (
              <li key={stage}>
                <span className="detail-eyebrow">{String(index + 1).padStart(2, '0')}</span>
                <span>{stage}</span>
                {index < project.flow.length - 1 && <span aria-hidden="true">→</span>}
              </li>
            ))}
          </ol>
          <p>{project.solution}</p>
        </section>

        <section aria-labelledby="project-decisions-title">
          <h3 id="project-decisions-title">Technical decisions</h3>
          <div className="detail-grid">
            {project.decisions.map((decision) => (
              <div key={decision.title}>
                <h4>{decision.title}</h4>
                <p>{decision.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="project-stack-title">
          <h3 id="project-stack-title">Built with</h3>
          <ul className="detail-stack">
            {project.stack.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
        </section>

        <section aria-labelledby="project-outcome-title">
          <h3 id="project-outcome-title">Outcome</h3>
          <p>{project.outcomes}</p>
        </section>

        {(project.repo || project.demo) && (
          <div className="detail-links">
            {project.repo && (
              <a className="text-link" href={project.repo} target="_blank" rel="noopener noreferrer" data-cursor="CODE ↗">
                VIEW SOURCE <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {project.demo && (
              <a className="text-link" href={project.demo} target="_blank" rel="noopener noreferrer" data-cursor="OPEN ↗">
                PROJECT SHOWCASE <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      </article>
    </dialog>
  )
}
