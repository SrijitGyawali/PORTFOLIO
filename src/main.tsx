import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource/barlow-condensed/latin-500.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import App from './App'
import './styles/global.css'
import './styles/scroll-motion.css'
import './styles/readability.css'

const container = document.getElementById('root')!
const app = <StrictMode><App /></StrictMode>
// Production HTML is prerendered (scripts/prerender.mjs); attach to it instead of
// replacing it, so early scrolling and the first paint are preserved.
if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
