import { useEffect, useState } from 'react'

export default function RuntimeStatus() {
  const [renderer, setRenderer] = useState('loading')
  // Build-time rendering has no connection state; assume online until the browser reports.
  const [online, setOnline] = useState(() => navigator.onLine !== false)
  useEffect(() => {
    const updateRenderer = () => setRenderer(document.querySelector<HTMLElement>('.webgl-world')?.dataset.webgl ?? 'loading')
    const updateNetwork = () => setOnline(navigator.onLine)
    const observer = new MutationObserver(updateRenderer)
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-webgl'] })
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)
    updateRenderer()
    return () => { observer.disconnect(); window.removeEventListener('online', updateNetwork); window.removeEventListener('offline', updateNetwork) }
  }, [])
  return <div className="runtime-status" data-render-status={renderer}><span><i /> {renderer === 'loading' ? 'INITIALIZING RUNTIME' : 'SYSTEM ACTIVE'}</span><small>NETWORK {online ? 'ONLINE' : 'OFFLINE'} / {renderer === 'loading' ? 'RENDERER LOADING' : renderer === 'ready' ? 'RENDERER READY' : 'STATIC MODE'}</small></div>
}
