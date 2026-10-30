import { Fragment, useRef, type CSSProperties } from 'react'
import { projects, type Project } from '../data/projects'
import { useProjectEffects } from '../animation/useProjectEffects'
import '../styles/projects.css'

const presentations: Record<string, { mark: string[]; title: string; brief: string; recognition: string }> = {
  verix: {
    mark: ['verix.'], title: 'Real signals. Verifiable credits.',
    brief: 'IoT monitoring, AI agents and Solana turn environmental data into a traceable carbon credit marketplace.',
    recognition: 'Cypherpunk winner · Nepal',
  },
  cex: {
    mark: ['CEX'], title: 'Order in a concurrent world.',
    brief: 'A trading engine in Go, exploring order matching, persistent balances and real-time market data. Built around correctness under concurrency.',
    recognition: 'Backend systems · In development',
  },
  tapguard: {
    mark: ['tapguard', 'vault.'], title: 'One tap. Verified on-chain.',
    brief: 'NFC payments meet a Solana smart vault, with signature verification, daily spending limits and an emergency freeze.',
    recognition: 'Cryptographic payments · Solana',
  },
  smartmarket: {
    mark: ['smart', 'market.'], title: 'Agents coordinate. Value moves.',
    brief: 'Specialist agents connect user intent, carbon credit trading and blockchain payments through Google A2A and the Hedera Agent Kit.',
    recognition: 'ETHOnline 2025 · 2nd place in sponsor track',
  },
}

export default function Projects({ onSelect, onIndex }: { onSelect: (project: Project) => void; onIndex: () => void }) {
  const ref = useRef<HTMLElement>(null)
  useProjectEffects(ref)
  return <section ref={ref} id="projects" className="projects-section" aria-labelledby="projects-title">
    <header className="projects-heading">
      <p>Selected work, from signal to system.</p>
      <h2 id="projects-title">Projects<span aria-hidden="true">.</span></h2>
      <button className="projects-index" onClick={event => { event.currentTarget.focus({ preventScroll: true }); onIndex() }}>OPEN PROJECT INDEX <span aria-hidden="true">↗</span></button>
    </header>
    <nav className="project-shortcuts" aria-label="Project shortcuts">
      {projects.map(project => <a href={`#${project.id}`} key={project.id}><span className="shortcut-number">{project.number}</span><span>{project.id === 'tapguard' ? 'TAPGUARD' : project.name}</span><span className="shortcut-arrow" aria-hidden="true">↗</span></a>)}
    </nav>
    <div className="project-deck">
      {projects.map((project, index) => {
        const presentation = presentations[project.id]
        return <Fragment key={project.id}>
          <div className="project-anchor" id={`${project.id}-start`} data-project-anchor={project.id} aria-hidden="true" />
          <article id={project.id} className={`project-entry project-entry-${project.id}`} style={{ '--project-index': index } as CSSProperties} aria-labelledby={`${project.id}-title`}>
            <div className="project-card">
              <div className="project-art" aria-hidden="true">
                <div className="project-art-top"><span>{project.category}</span><span>{project.number} / 04</span></div>
                <div className="project-wordmark">{presentation.mark.map(line => <span key={line}>{line}</span>)}</div>
                <div className="project-art-echo">
                  {[0, 1].map(row => <div className="project-echo-track" key={row}>
                    {[0, 1].map(copy => <div className="project-echo-group" key={copy}>
                      {[0, 1, 2].map(word => <span key={word}>{project.name}</span>)}
                    </div>)}
                  </div>)}
                </div>
                <span className="project-art-caption">{project.id === 'cex' ? 'ENGINEERED IN GO' : project.id === 'tapguard' ? 'TAP. VERIFY. TRANSFER.' : project.id === 'smartmarket' ? 'INTENT INTO ACTION' : 'FROM THE GROUND UP'}</span>
              </div>
              <div className="project-card-body">
                <span className="project-card-glow" aria-hidden="true" />
                <div className="project-card-kicker"><span>{project.name}</span><span>{project.number}</span></div>
                <h3 id={`${project.id}-title`} className="project-card-title">{presentation.title}</h3>
                <p className="project-brief">{presentation.brief}</p>
                <ul className="project-technologies" aria-label={`${project.name} technologies`}>{project.stack.map(technology => <li key={technology}>{technology}</li>)}</ul>
                <div className="project-card-bottom">
                  <p className="project-recognition">{presentation.recognition}</p>
                  <button className="project-card-open" onClick={event => {
                    // Safari does not focus buttons on pointer click by default.
                    event.currentTarget.focus({ preventScroll: true })
                    onSelect(project)
                  }} data-cursor="VIEW ↗">EXPLORE THE BUILD <span aria-hidden="true">↗</span></button>
                </div>
              </div>
            </div>
          </article>
        </Fragment>
      })}
    </div>
  </section>
}
