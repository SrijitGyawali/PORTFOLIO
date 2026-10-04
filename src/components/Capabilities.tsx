import { useState } from 'react'
import { systems } from '../data/capabilities'

export default function Capabilities() {
  const [active, setActive] = useState(0)
  const system = systems[active]
  return <section id="capabilities" className="capabilities section-shell" aria-labelledby="capabilities-title">
    <div className="section-top"><span className="eyebrow">02 / CORE CAPABILITIES</span><span className="eyebrow dim">THREE LAYERS. ONE SYSTEM.</span></div>
    <h2 id="capabilities-title" className="section-display" data-reveal>BUILD THE<br /><span className="outline">INVISIBLE.</span></h2>
    <div className="capability-layout">
      <div className="capability-tabs" role="tablist" aria-label="Engineering capabilities">
        {systems.map((item, index) => <button id={`capability-tab-${index}`} key={item.name} role="tab" aria-selected={active === index} aria-controls="capability-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); const next = (active + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? 2 : 1)) % 3; setActive(next); document.getElementById(`capability-tab-${next}`)?.focus() } }}><span>0{index + 1}</span>{item.name}<b>↗</b></button>)}
      </div>
      <div id="capability-panel" className="capability-panel" role="tabpanel" aria-labelledby={`capability-tab-${active}`} tabIndex={0}>
        <span className="eyebrow signal">{system.label}</span><h3>{system.title}</h3><p>{system.description}</p>
        <ul>{system.skills.map(skill => <li key={skill}>{skill}</li>)}</ul>
      </div>
    </div>
  </section>
}
