import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
