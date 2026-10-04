import { CatmullRomCurve3, Vector3 } from 'three'

export type Field = {
  columns: number
  rows: number
  count: number
  targets: Float32Array[]
  scatter: Float32Array
  seeds: Float32Array
  accents: Float32Array
  edges: Uint16Array
}

/** A seeded hash keeps the world stable through remounts and reverse scrolling. */
export function noise(index: number, seed = 0) {
  const n = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

/** Four straight sides, sampled at even distances: never a circular tube. */
function square(t: number): [number, number] {
  const side = (t * 4) % 4
  if (side < 1) return [-1 + side * 2, -1]
  if (side < 2) return [1, -1 + (side - 1) * 2]
  if (side < 3) return [1 - (side - 2) * 2, 1]
  return [-1, 1 - (side - 3) * 2]
}

const topologyNodes = [
  [-1.8, 1.6, -.5], [0, 1.3, .8], [1.8, 1.5, -.4],
  [1.9, -.6, .6], [.2, -.1, -.5], [-1.7, -.4, .7],
  [-1.5, -1.7, -.5], [.4, -1.6, .9], [1.9, -1.8, -.2],
] as const

const topologyRoute = [0, 1, 2, 4, 5, 0, 4, 3, 2, 3, 8, 7, 4, 6, 5, 6, 7, 8]
const agentNodes = [[-1.8, 1.05, .2], [0, 1.7, -.2], [1.8, .85, .2], [1.6, -1.3, -.1], [-.3, -.35, .4], [-1.9, -1.1, -.4]]
const architectureNodes = [[0, 2, 0], [0, 1.05, 0], [0, .1, 0], [-1.8, -1, 0], [0, -1, 0], [1.8, -1, 0], [1.45, -2.1, 0], [2.25, -2.1, 0]]

function write(target: Float32Array, i: number, x: number, y: number, z: number) {
  target[i * 3] = x
  target[i * 3 + 1] = y
  target[i * 3 + 2] = z
}

/** All chapters share the same vertex identities, so every transition reverses exactly. */
export function createField(mobile: boolean): Field {
  const columns = mobile ? 72 : 120
  const rows = mobile ? 16 : 28
  const count = columns * rows
  const targets = Array.from({ length: 10 }, () => new Float32Array(count * 3))
  const scatter = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const accents = new Float32Array(count)
  const edgeIndices: number[] = []
  // An open, folded data conduit. The non-planar turns reveal the square section.
  const spine = new CatmullRomCurve3([
    new Vector3(-1.55, -1.8, -.7), new Vector3(1.1, -1.8, -.7),
    new Vector3(1.1, -.1, -.7), new Vector3(-1.2, -.1, -.7),
    new Vector3(-1.2, -.1, .95), new Vector3(-1.2, 1.75, .95),
    new Vector3(1.2, 1.75, .95), new Vector3(1.2, .35, .95),
    new Vector3(1.2, .35, -.65),
  ], false, 'catmullrom', .045)
  const frames = spine.computeFrenetFrames(columns - 1, false)
  const center = new Vector3()
  const point = new Vector3()

  for (let column = 0; column < columns; column++) {
    const u = column / (columns - 1)
    spine.getPoint(u, center)
    for (let row = 0; row < rows; row++) {
      const i = column * rows + row
      const v = row / rows
      const [sx, sy] = square(v)
      const seed = noise(i)
      seeds[i] = seed
      accents[i] = seed > .983 ? 1 : 0
      point.copy(center).addScaledVector(frames.normals[column], sx * .39).addScaledVector(frames.binormals[column], sy * .39)
      write(targets[0], i, point.x, point.y, point.z)

      // Network: packets occupy a connected route through nine distributed nodes.
      const segment = Math.min(topologyRoute.length - 2, Math.floor(u * (topologyRoute.length - 1)))
      const routeT = u * (topologyRoute.length - 1) - segment
      const from = topologyNodes[topologyRoute[segment]]
      const to = topologyNodes[topologyRoute[segment + 1]]
      const nx = from[0] + (to[0] - from[0]) * routeT
      const ny = from[1] + (to[1] - from[1]) * routeT
      const nz = from[2] + (to[2] - from[2]) * routeT
      const junction = .03 + .16 * Math.pow(Math.abs(Math.cos(routeT * Math.PI)), 12)
      write(targets[1], i, nx + sx * junction, ny + sy * junction, nz + Math.sin(v * Math.PI * 2) * junction)
      write(targets[2], i, nx * 1.1 + sx * junction * 1.3, ny * .95 + sy * junction * 1.3, nz * 1.5)

      // VERIX: four spatially separated, gridded ledger planes.
      const layer = Math.min(3, Math.floor(u * 4))
      const layerU = u === 1 ? 1 : (u * 4) % 1
      write(targets[3], i, (layerU - .5) * 3.6, (layer - 1.5) * .85 + .04 * Math.sin(v * Math.PI * 4), (v - .5) * 3.1)

      // CEX: eight parallel bid/ask lanes converge in the matching core.
      const lane = Math.min(7, Math.floor(u * 8))
      const laneU = u === 1 ? 1 : (u * 8) % 1
      const laneY = (lane - 3.5) * .4
      const centerWeight = Math.pow(Math.abs(laneU * 2 - 1), .55)
      write(targets[4], i, (laneU - .5) * 5, laneY * centerWeight + sx * .055, sy * .13 + Math.sin(laneU * Math.PI) * .26)

      // TapGuard: rectangular verification gates with multiple depth planes.
      const gate = Math.min(5, Math.floor(u * 6))
      const gateU = u === 1 ? 1 : (u * 6) % 1
      write(targets[5], i, sx * (1.3 + gateU * .14), sy * (1.55 + gateU * .14), (gate - 2.5) * .7 + gateU * .1)

      // Autonomous services: distinct small machines around a shared coordinator.
      const agent = Math.min(agentNodes.length - 1, Math.floor(u * agentNodes.length))
      const agentU = u === 1 ? 1 : (u * agentNodes.length) % 1
      const agentNode = agentNodes[agent]
      const agentSize = agent === 4 ? .47 : .32
      write(targets[6], i, agentNode[0] + sx * agentSize, agentNode[1] + sy * agentSize, agentNode[2] + (agentU - .5) * .75)

      const system = Math.min(architectureNodes.length - 1, Math.floor(u * architectureNodes.length))
      const systemU = u === 1 ? 1 : (u * architectureNodes.length) % 1
      const systemNode = architectureNodes[system]
      write(targets[7], i, systemNode[0] + sx * .32, systemNode[1] + sy * .21, (systemU - .5) * .6)

      // A quiet open sheet precedes the final collapse.
      write(targets[8], i, (u - .5) * 3.6, (v - .5) * 3.7, .45 * Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI))
      write(targets[9], i, (seed - .5) * .035, (noise(i, 1) - .5) * .035, (noise(i, 2) - .5) * .035)
      write(scatter, i, (noise(i, 3) - .5) * 5, (noise(i, 4) - .5) * 4, .7 + noise(i, 5) * 3.5)
      if (column < columns - 1) edgeIndices.push(i, i + rows)
      edgeIndices.push(i, column * rows + (row + 1) % rows)
    }
  }
  return { columns, rows, count, targets, scatter, seeds, accents, edges: new Uint16Array(edgeIndices) }
}

export function fieldPosition(scene: number, reducedMotion: boolean) {
  const input = Math.max(0, Math.min(9, scene))
  const a = Math.floor(input)
  // Hold a resolved formation while its story is read; move near the chapter exit.
  const fraction = reducedMotion ? 0 : Math.max(0, Math.min(1, (input - a - .55) / .45))
  return a + fraction
}

export function sampleField(field: Field, scene: number, output: Float32Array, reducedMotion: boolean) {
  const position = fieldPosition(scene, reducedMotion)
  const a = Math.floor(position)
  const b = Math.min(a + 1, 9)
  const fraction = position - a
  const eased = fraction * fraction * (3 - 2 * fraction)
  const dispersion = reducedMotion ? 0 : Math.pow(Math.sin(fraction * Math.PI), 2) * .65
  const from = field.targets[a]
  const to = field.targets[b]
  if (fraction === 0) {
    output.set(from)
    return { position, dispersion, fraction }
  }
  for (let i = 0; i < output.length; i++) {
    output[i] = from[i] + (to[i] - from[i]) * eased + field.scatter[i] * dispersion
  }
  return { position, dispersion, fraction }
}

/** Each triplet is a buy, a sell, and the resulting trade. Writes without allocation. */
export function exchangePacket(index: number, cycle: number, output: Float32Array) {
  const kind = index % 3
  const lane = Math.floor(index / 3) % 8
  if (kind === 2) {
    output[0] = cycle * 2.5
    output[1] = 0
    output[2] = (1 - cycle) * .26
    return
  }
  const progress = kind === 0 ? cycle * .5 : 1 - cycle * .5
  output[0] = (progress - .5) * 5
  output[1] = (lane - 3.5) * .4 * Math.pow(Math.abs(progress * 2 - 1), .55)
  output[2] = Math.sin(progress * Math.PI) * .26
}
