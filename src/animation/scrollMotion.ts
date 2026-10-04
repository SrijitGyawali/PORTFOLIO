export type MotionPreset = 'title' | 'body' | 'meta' | 'panel' | 'line' | 'item' | 'ghost'
export type MotionOptions = { preset: MotionPreset; depth: number; shift: number; stagger: number; compact: boolean }
const clamp = (n: number) => Math.max(0, Math.min(1, n))
const ease = (n: number) => n * n * (3 - 2 * n)

/** Layout coordinates in, reversible presentation values out; no DOM reads. */
export function scrollMotion(top: number, height: number, viewport: number, scroll: number, velocity: number, options: MotionOptions) {
  const y = top - scroll
  const strength = options.compact ? .36 : 1
  const delay = options.stagger * (options.compact ? 10 : 20)
  const enter = ease(clamp((viewport * .97 - y - delay) / Math.max(1, viewport * .34)))
  const leave = ease(clamp((-y - height * .4) / Math.max(1, viewport * .5)))
  const passage = clamp((viewport - y) / Math.max(1, viewport + height))
  const isDivider = options.preset === 'line'
  const depth = (0.5 - passage) * options.depth * strength
  const revealDistance = options.preset === 'title' ? 76 : options.preset === 'ghost' ? 0 : 14
  const exitDistance = options.preset === 'title' ? 24 : 10
  return {
    x: isDivider ? 0 : ((1 - enter) * options.shift - leave * options.shift * .5) * strength,
    y: isDivider ? 0 : depth + ((1 - enter) * revealDistance - leave * exitDistance) * strength,
    rotate: options.preset === 'title' ? ((1 - enter) * 1.8 - leave * .7) * strength : 0,
    scale: options.preset === 'ghost' ? .94 + passage * .12 : 1,
    // Scroll can change position and depth; content must retain its full contrast.
    opacity: 1,
    reveal: enter,
    skew: options.preset === 'title' || options.preset === 'ghost' ? Math.max(-1.25, Math.min(1.25, velocity * -.024)) * strength : 0,
  }
}
