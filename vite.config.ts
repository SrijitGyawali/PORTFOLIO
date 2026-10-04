import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The optional Three.js renderer is a single lazy chunk (~134 kB gzip).
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) return 'three'
          if (id.includes('/node_modules/animejs/')) return 'choreography'
          if (id.includes('/node_modules/@fiddle-digital/string-tune/')) return 'scroll'
        },
      },
    },
  },
})
