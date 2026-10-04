/** Rasterize the actual self-hosted display face once, then retain only pixel coordinates. */
export function sampleIdentity(count: number): Float32Array | null {
  const lines = [...document.querySelectorAll<HTMLElement>('.name-line')]
  if (!lines.length) return null
  const surface = document.createElement('canvas')
  surface.width = window.innerWidth
  surface.height = Math.min(1600, window.innerHeight + 600)
  const context = surface.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.fillStyle = '#fff'
  context.textBaseline = 'alphabetic'
  for (const line of lines) {
    const rect = line.getBoundingClientRect()
    const style = getComputedStyle(line)
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing
    const text = line.textContent || ''
    const measure = context.measureText(text)
    const glyphHeight = measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent
    const baseline = rect.top + window.scrollY + (rect.height - glyphHeight) / 2 + measure.actualBoundingBoxAscent
    context.fillText(text, rect.left, baseline)
  }
  const pixels = context.getImageData(0, 0, surface.width, surface.height).data
  const occupied: number[] = []
  for (let y = 0; y < surface.height; y += 3) {
    for (let x = 0; x < surface.width; x += 3) {
      if (pixels[(y * surface.width + x) * 4 + 3] > 128) occupied.push(x, y)
    }
  }
  if (!occupied.length) return null
  const output = new Float32Array(count * 2)
  const total = occupied.length / 2
  for (let i = 0; i < count; i++) {
    const pixel = Math.floor((i * .61803398875 % 1) * total) * 2
    output[i * 2] = occupied[pixel]
    output[i * 2 + 1] = occupied[pixel + 1]
  }
  return output
}
