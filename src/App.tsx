import { lazy, Suspense, useRef, useState, useSyncExternalStore } from 'react'
import { useRuntime } from './animation/useRuntime'
import { useChoreography } from './animation/useChoreography'
import { runtime } from './animation/runtime'
import { Navigation, NavigationMenu, ProjectIndex } from './components/Navigation'
import Cursor from './components/Cursor'
import Capabilities from './components/Capabilities'
import Architecture from './components/Architecture'
import Contact from './components/Contact'
import RuntimeStatus from './components/RuntimeStatus'
import ProjectDetail from './components/ProjectDetail'
import Projects from './components/Projects'
import WorldBoundary from './components/WorldBoundary'
import { profile } from './data/profile'
import type { Project } from './data/projects'

const World = lazy(() => import('./webgl/World'))
const noSubscription = () => () => {}

function NameLine({ children }: { children: string }) {
  return <span className="name-line" aria-hidden="true">{children.split('').map((letter, index) => <span className="hero-letter" key={`${letter}-${index}`}>{letter}</span>)}</span>
}

export default function App() {
  const root = useRef<HTMLDivElement>(null)
  const [indexOpen, setIndexOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState<Project | null>(null)
  const [paused, setPaused] = useState(false)
  // False in the prerendered HTML and during hydration, so the WebGL world mounts only in the browser.
  const inBrowser = useSyncExternalStore(noSubscription, () => true, () => false)
  useRuntime()
  useChoreography(root)

  function toggleMotion() {
    runtime.paused = !paused
    document.documentElement.dataset.motion = !paused ? 'paused' : 'running'
    setPaused(!paused)
  }

  return <div ref={root} className="app">
    <a className="skip-link" href="#verix">Skip to selected work</a>
    <div className="world-fallback" aria-hidden="true" />
    {inBrowser && <WorldBoundary><Suspense fallback={null}><World /></Suspense></WorldBoundary>}
    <div className="ambient-grain" aria-hidden="true" />
    <Navigation onIndex={() => setMenuOpen(true)} open={menuOpen} />
    <main>
      <section id="home" className="hero section-shell" aria-labelledby="hero-title">
        <div className="hero-topline"><span className="eyebrow"><i className="signal-square" /> INSIDE THE RUNTIME</span><span className="eyebrow hero-edition">AN EXPLORATION OF SYSTEMS & SELF</span></div>
        <div className="hero-name-wrap"><h1 id="hero-title" aria-label="Srijit Gyawali"><NameLine>SRIJIT</NameLine><NameLine>GYAWALI</NameLine></h1><div className="hero-cross" aria-hidden="true">+</div></div>
        <div className="hero-role"><span className="eyebrow signal">BACKEND ENGINEER</span><p>GO <span>·</span> DISTRIBUTED SYSTEMS <span>·</span> WEB3</p></div>
        <div className="world-caption" aria-hidden="true"><span className="caption-cross">+</span><div>RUNTIME / 001<span>ORDER EMERGES FROM COMPLEXITY.</span></div><span className="coordinates">[ X, Y, Z ]</span></div>
        <div className="hero-bottom"><a href="#proof" className="scroll-cue"><span className="scroll-arrow">↓</span><span>SCROLL TO ENTER<small>THERE’S MORE BENEATH THE SURFACE.</small></span></a><p>I build systems<br />that move <em>value.</em></p><RuntimeStatus /></div>
      </section>

      <section id="proof" className="proof section-shell" aria-labelledby="proof-title">
        <div className="section-top"><span className="eyebrow">01 / PROOF OF WORK</span><span className="eyebrow dim">IDEAS ARE GOOD. SHIPPED SYSTEMS ARE BETTER.</span></div>
        <h2 id="proof-title" className="proof-heading" data-reveal>LESS TALK.<br /><span>MORE SIGNAL.</span></h2>
        <div className="achievement-row"><span className="record-label">[ RECOGNITION / 01 ]</span><div className="achievement-event"><h3>CYPHERPUNK</h3><p>LOCAL TRACK — NEPAL · VERIX</p></div><div className="achievement-result"><strong>WINNER</strong><span>$5,000 LOCAL TRACK</span></div><a href="#verix" aria-label="Explore Verix, Cypherpunk winner">↗</a></div>
        <div className="achievement-row"><span className="record-label">[ RECOGNITION / 02 ]</span><div className="achievement-event"><h3>ETHONLINE 2025</h3><p>HEDERA AGENT KIT + GOOGLE A2A · SMARTMARKET</p></div><div className="achievement-result"><strong>2ND PLACE</strong><span>BEST USE OF HEDERA AGENT KIT + GOOGLE A2A</span></div><a href="#smartmarket" aria-label="Explore SmartMarket, ETHOnline second place">↗</a></div>
      </section>

      <Capabilities />

      <Projects onSelect={setSelected} onIndex={() => setIndexOpen(true)} />

      <Architecture />

      <section id="about" className="about section-shell" aria-labelledby="about-title"><div className="section-top"><span className="eyebrow">08 / THE ENGINEER</span><span className="eyebrow dim">BEYOND THE INTERFACE</span></div><h2 id="about-title" data-reveal>I CARE ABOUT<br />WHAT HAPPENS<br /><span className="outline">BEHIND</span><br />THE INTERFACE<span className="signal">.</span></h2><div className="about-copy"><span className="eyebrow signal">SRIJIT GYAWALI / BACKEND ENGINEER</span><p>{profile.summary}</p><div className="exploring"><span className="eyebrow dim">CURRENTLY EXPLORING</span><ul><li>Distributed systems</li><li>Go internals</li><li>Web3 infrastructure</li><li>Agentic systems</li></ul></div></div></section>
      <Contact />
    </main>
    <aside className="experience-controls" aria-label="Experience controls"><span className="chapter-readout" data-current-chapter>00 / INITIALIZATION</span><button onClick={toggleMotion} aria-pressed={paused} aria-label={paused ? 'Resume ambient animation' : 'Pause ambient animation'}><span className="motion-icon" aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{paused ? 'RESUME MOTION' : 'PAUSE MOTION'}</button></aside>
    <div className="global-progress" aria-hidden="true"><span data-global-progress /></div>
    <NavigationMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    <ProjectIndex open={indexOpen} onClose={() => setIndexOpen(false)} />
    <ProjectDetail project={selected} onClose={() => setSelected(null)} />
    <Cursor />
  </div>
}
