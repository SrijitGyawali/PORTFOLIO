import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

export { profile } from './data/profile'
export { projects } from './data/projects'
export { systems } from './data/capabilities'

/** Build-time render: crawlers and link previews receive the full page as HTML. */
export function render() {
  return renderToString(<StrictMode><App /></StrictMode>)
}
