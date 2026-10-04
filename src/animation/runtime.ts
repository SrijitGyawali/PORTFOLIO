/** High-frequency animation state lives outside React's render cycle. */
export const runtime = {
  progress: 0,
  scroll: 0,
  velocity: 0,
  scene: 0,
  pointer: { x: 0, y: 0 },
  reducedMotion: false,
  paused: false,
  preview: -1,
  visible: true,
}

export const sceneSections = ['home', 'proof', 'capabilities', 'verix', 'cex', 'tapguard', 'smartmarket', 'systems', 'about', 'contact'] as const
