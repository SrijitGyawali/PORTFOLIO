import { useState } from 'react'

export default function Architecture() {
  const [request, setRequest] = useState(0)
  return <section id="systems" className="systems section-shell" aria-labelledby="systems-title">
    <div className="section-top"><span className="eyebrow">07 / SYSTEMS THINKING</span><span className="eyebrow dim">FOLLOW THE REQUEST</span></div>
    <div className="systems-heading"><h2 id="systems-title" className="section-display" data-reveal>EVERY REQUEST.<br /><span className="outline">A CONSIDERED PATH.</span></h2><p>Fast is a feature.<br />Correct is a requirement.<br />I design for both.</p></div>
    <div className="architecture">
      <div className="architecture-ingress"><button onClick={() => setRequest(value => value + 1)} className="request-node">SEND REQUEST <span>↗</span></button><span className="flow-line horizontal" key={`gateway-${request}`} /><div className="arch-node">API GATEWAY<small>VALIDATE / AUTHENTICATE</small></div><span className="flow-line horizontal" key={`service-${request}`} /><div className="arch-node primary-node">GO SERVICE<small>CONCURRENCY / IDEMPOTENCY</small></div></div>
      <div className="architecture-branches" key={request}>
        <div className="arch-branch"><span className="flow-line" /><div className="arch-node">REDIS<small>CACHE</small></div><p>Serve the hot path.</p></div>
        <div className="arch-branch"><span className="flow-line" /><div className="arch-node">POSTGRESQL<small>PERSISTENCE</small></div><p>Keep the source of truth.</p></div>
        <div className="arch-branch"><span className="flow-line" /><div className="arch-node">KAFKA<small>EVENTS</small></div><span className="flow-line short" /><div className="arch-node worker-node">WORKERS<small>ASYNC PROCESSING</small></div></div>
      </div>
    </div>
    <div className="architecture-footer"><span className="eyebrow dim">ILLUSTRATIVE ARCHITECTURE / NOT A LIVE SERVICE</span><span role="status" className="eyebrow signal">{request > 0 ? `REQUEST ${String(request).padStart(2, '0')} DISPATCHED` : 'READY WHEN YOU ARE'}</span></div>
  </section>
}
