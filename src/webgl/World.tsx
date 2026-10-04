import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { runtime } from '../animation/runtime'
import { createField, exchangePacket, fieldPosition, noise, sampleField } from './geometry'
import { pointFragmentShader, pointVertexShader } from './shaders'
import { sampleIdentity } from './identity'

const SCENE_ROTATIONS = [
  [.17, .56, -.13], [.05, .1, -.06], [.12, -.17, .03],
  [.27, .43, -.08], [.09, -.16, -.04], [.13, -.46, -.08],
  [.04, .12, -.03], [.04, .04, 0], [.15, -.35, -.14], [0, 0, 0],
]

function material(dpr: number, scale = 1) {
  return new THREE.ShaderMaterial({
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    uniforms: {
      uTime: { value: 0 }, uDpr: { value: dpr }, uScale: { value: scale },
      uMotion: { value: 1 }, uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })
}

/** One renderer for the whole site; the DOM remains complete if WebGL is unavailable. */
export default function World() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current
    if (!element) return
    let disposed = false
    let contextLost = false
    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const compact = window.matchMedia('(max-width: 767px)').matches
    const cores = navigator.hardwareConcurrency || 4
    let dpr = Math.min(window.devicePixelRatio || 1, compact || cores < 4 ? 1 : 1.5)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: dpr < 1.5, powerPreference: 'low-power' })
      renderer.setClearColor(0x060708, 0)
      renderer.setPixelRatio(dpr)
      renderer.outputColorSpace = THREE.SRGBColorSpace
    } catch {
      element.dataset.webgl = 'fallback'
      return
    }

    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none'
    element.appendChild(canvas)
    element.dataset.webgl = 'ready'
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 40)
    const projectionScale = Math.tan(THREE.MathUtils.degToRad(19)) * 2
    camera.position.set(0, 0, 10)
    const sculpture = new THREE.Group()
    scene.add(sculpture)
    const field = createField(compact || cores < 4)
    const positions = new Float32Array(field.targets[0])
    const pointGeometry = new THREE.BufferGeometry()
    const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
    pointGeometry.setAttribute('position', positionAttribute)
    pointGeometry.setAttribute('aSeed', new THREE.BufferAttribute(field.seeds, 1))
    pointGeometry.setAttribute('aAccent', new THREE.BufferAttribute(field.accents, 1))
    const pointsMaterial = material(dpr)
    const particles = new THREE.Points(pointGeometry, pointsMaterial)
    particles.frustumCulled = false
    sculpture.add(particles)

    const wireGeometry = new THREE.BufferGeometry()
    const wirePositions = new Float32Array(positions)
    const wirePositionAttribute = new THREE.BufferAttribute(wirePositions, 3).setUsage(THREE.DynamicDrawUsage)
    wireGeometry.setAttribute('position', wirePositionAttribute)
    wireGeometry.setIndex(new THREE.BufferAttribute(field.edges, 1))
    const wireMaterial = new THREE.LineBasicMaterial({ color: 0xbcc2b4, transparent: true, opacity: .21, depthWrite: false, depthTest: false })
    const wire = new THREE.LineSegments(wireGeometry, wireMaterial)
    wire.frustumCulled = false
    sculpture.add(wire)

    const packetCount = compact ? 12 : 26
    const packetPositions = new Float32Array(packetCount * 3)
    const exchangePosition = new Float32Array(3)
    const packetSeeds = Float32Array.from({ length: packetCount }, (_, i) => noise(i, 9))
    const packetGeometry = new THREE.BufferGeometry()
    const packetPositionAttribute = new THREE.BufferAttribute(packetPositions, 3).setUsage(THREE.DynamicDrawUsage)
    packetGeometry.setAttribute('position', packetPositionAttribute)
    packetGeometry.setAttribute('aSeed', new THREE.BufferAttribute(packetSeeds, 1))
    packetGeometry.setAttribute('aAccent', new THREE.BufferAttribute(new Float32Array(packetCount).fill(1), 1))
    const packetMaterial = material(dpr, 1.55)
    const packets = new THREE.Points(packetGeometry, packetMaterial)
    packets.frustumCulled = false
    sculpture.add(packets)

    // A hard-edged matching core only resolves during the exchange chapter.
    const coreBox = new THREE.BoxGeometry(.55, .55, .55)
    const coreGeometry = new THREE.EdgesGeometry(coreBox)
    coreBox.dispose()
    const coreMaterial = new THREE.LineBasicMaterial({ color: 0xb7ff4a, transparent: true, opacity: 0, depthWrite: false })
    const core = new THREE.LineSegments(coreGeometry, coreMaterial)
    sculpture.add(core)

    // Fine registration marks situate the object without turning it into a HUD.
    const registrationVertices: number[] = []
    for (const x of [-2.55, 2.55]) {
      for (const y of [-2.6, 2.6]) {
        registrationVertices.push(x, y, -.9, x + (x < 0 ? .14 : -.14), y, -.9)
        registrationVertices.push(x, y, -.9, x, y + (y < 0 ? .14 : -.14), -.9)
      }
    }
    const registrationGeometry = new THREE.BufferGeometry()
    registrationGeometry.setAttribute('position', new THREE.Float32BufferAttribute(registrationVertices, 3))
    const registrationMaterial = new THREE.LineBasicMaterial({ color: 0xbcc2b4, transparent: true, opacity: .19, depthWrite: false })
    const registration = new THREE.LineSegments(registrationGeometry, registrationMaterial)
    sculpture.add(registration)

    let width = 0
    let height = 0
    let dirty = true
    let lastTime = performance.now()
    let elapsed = 0
    let currentScene = runtime.preview >= 0 ? runtime.preview : runtime.scene
    let lastScene = -1
    let lastStatic = false
    let lastPointerX = 0
    let lastPointerY = 0
    let frameCost = 0
    let frameSamples = 0
    let adapting = true
    let smoothVelocity = 0
    let identity: Float32Array | null = null
    let shape = sampleField(field, currentScene, wirePositions, runtime.reducedMotion || runtime.paused)
    let geometryPosition = -1
    let wasGlyphBridge = false
    const inverse = new THREE.Matrix4()

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      identity = sampleIdentity(field.count)
      dirty = true
    }

    function onContextLost(event: Event) {
      event.preventDefault()
      contextLost = true
      element!.dataset.webgl = 'fallback'
    }

    function onContextRestored() {
      contextLost = false
      dirty = true
      element!.dataset.webgl = 'ready'
      resize()
    }

    function schedule(slow = false) {
      if (disposed) return
      if (slow) timer = setTimeout(() => frame(performance.now()), 150)
      else raf = requestAnimationFrame(frame)
    }

    function frame(now: number) {
      if (disposed) return
      const dt = Math.min((now - lastTime) / 1000, .06)
      const frameMs = now - lastTime
      lastTime = now
      if (document.hidden || !runtime.visible || contextLost) {
        schedule(true)
        return
      }
      const staticMotion = runtime.reducedMotion || runtime.paused
      const targetScene = Math.max(0, Math.min(9, runtime.preview >= 0 ? runtime.preview : runtime.scene))
      currentScene = staticMotion ? Math.floor(targetScene)
        : Math.abs(targetScene - currentScene) < .0001 ? targetScene
          : currentScene + (targetScene - currentScene) * (1 - Math.exp(-dt * 8))
      if (staticMotion && !dirty && lastStatic && lastScene === currentScene) {
        schedule(true)
        return
      }
      if (!staticMotion) elapsed += dt
      lastStatic = staticMotion
      lastScene = currentScene
      const glyphBridge = !staticMotion && identity !== null && currentScene > .035 && currentScene < 1
      const nextPosition = fieldPosition(currentScene, staticMotion)
      const geometryChanged = dirty || Math.abs(nextPosition - geometryPosition) > .0001
        || (Number.isInteger(nextPosition) && nextPosition !== geometryPosition)
      if (geometryChanged) {
        shape = sampleField(field, currentScene, wirePositions, staticMotion)
        geometryPosition = nextPosition
        wirePositionAttribute.needsUpdate = true
      }
      if (!glyphBridge && (geometryChanged || wasGlyphBridge)) {
        positions.set(wirePositions)
        positionAttribute.needsUpdate = true
      }
      dirty = false
      const sceneA = Math.floor(shape.position)
      const sceneB = Math.min(sceneA + 1, 9)
      const transition = shape.fraction * shape.fraction * (3 - 2 * shape.fraction)
      const quiet = Math.max(0, Math.min(1, shape.position - 8))
      const mobileViewport = width < 768
      // A camera pass continues through the readable hold, not just the morph.
      // Both curves return smoothly to zero at chapter boundaries and reverse with scroll.
      const localProgress = currentScene - Math.floor(currentScene)
      const chapterDepth = staticMotion ? 0 : Math.sin(localProgress * Math.PI) ** 2
      const chapterOrbit = staticMotion ? 0 : Math.sin(localProgress * Math.PI * 2) * chapterDepth
      const motionScale = mobileViewport ? .3 : 1
      const pointerEase = 1 - Math.exp(-dt * 3)
      if (staticMotion) {
        lastPointerX = 0
        lastPointerY = 0
        smoothVelocity = 0
      } else {
        lastPointerX += (runtime.pointer.x - lastPointerX) * pointerEase
        lastPointerY += (runtime.pointer.y - lastPointerY) * pointerEase
        smoothVelocity += (Math.min(Math.abs(runtime.velocity), 80) - smoothVelocity) * (1 - Math.exp(-dt * 2.45))
      }
      camera.position.x = lastPointerX * .05
      camera.position.y = -lastPointerY * .035 + chapterOrbit * .055 * motionScale
      camera.position.z = 10 - shape.dispersion * .5 - Math.min(smoothVelocity / 700, .12) - chapterDepth * .52 * motionScale
      const viewHeight = projectionScale * camera.position.z
      sculpture.position.x = (mobileViewport ? viewHeight * camera.aspect * .085 : viewHeight * camera.aspect * .225) + chapterOrbit * .13 * motionScale
      sculpture.position.y = (mobileViewport ? -1.25 : .2) - chapterDepth * .34 * motionScale
      sculpture.scale.setScalar(mobileViewport ? Math.min(.56, camera.aspect * .86) : Math.min(1, camera.aspect * .64))
      const rotationA = SCENE_ROTATIONS[sceneA]
      const rotationB = SCENE_ROTATIONS[sceneB]
      sculpture.rotation.set(
        rotationA[0] + (rotationB[0] - rotationA[0]) * transition + lastPointerY * .025 + chapterDepth * .08 * motionScale,
        rotationA[1] + (rotationB[1] - rotationA[1]) * transition + lastPointerX * .045 + chapterOrbit * .2 * motionScale,
        rotationA[2] + (rotationB[2] - rotationA[2]) * transition + chapterOrbit * .025 * motionScale,
      )
      camera.lookAt(0, 0, 0)

      // The outgoing name becomes this same point field, then resolves as a network.
      // Screen sampling happens only on font-ready/resize, never inside the frame loop.
      if (glyphBridge && identity) {
        sculpture.updateMatrixWorld(true)
        const m = inverse.copy(sculpture.matrixWorld).invert().elements
        const phase = THREE.MathUtils.clamp((currentScene - .085) / .88, 0, 1)
        const blend = phase * phase * (3 - 2 * phase)
        const scatter = Math.sin(phase * Math.PI) ** 2 * .8
        const target = field.targets[1]
        for (let i = 0; i < field.count; i++) {
          const x = (identity[i * 2] / width - .5) * viewHeight * camera.aspect
          const y = (.5 - (identity[i * 2 + 1] - runtime.scroll) / height) * viewHeight
          const localX = m[0] * x + m[4] * y + m[12]
          const localY = m[1] * x + m[5] * y + m[13]
          const localZ = m[2] * x + m[6] * y + m[14]
          const index = i * 3
          positions[index] = localX + (target[index] - localX) * blend + field.scatter[index] * scatter
          positions[index + 1] = localY + (target[index + 1] - localY) * blend + field.scatter[index + 1] * scatter
          positions[index + 2] = localZ + (target[index + 2] - localZ) * blend + field.scatter[index + 2] * scatter
        }
        positionAttribute.needsUpdate = true
      }
      wasGlyphBridge = glyphBridge

      wireMaterial.opacity = (sceneA === 1 || sceneA === 2 ? .19 : .245) * (1 - Math.min(1, shape.dispersion * 2.1)) * (1 - quiet)
      pointsMaterial.uniforms.uTime.value = elapsed
      pointsMaterial.uniforms.uMotion.value = staticMotion ? 0 : 1
      pointsMaterial.uniforms.uScale.value = glyphBridge ? 1.35 : 1
      pointsMaterial.uniforms.uOpacity.value = (.64 + shape.dispersion * .35) * (1 - quiet * .96)
      if (glyphBridge) {
        pointsMaterial.uniforms.uOpacity.value *= THREE.MathUtils.clamp((currentScene - .035) / .05, 0, 1)
        wireMaterial.opacity *= currentScene < .5 ? Math.max(0, 1 - currentScene * 3) : THREE.MathUtils.clamp((currentScene - .86) / .14, 0, 1)
      }
      packetMaterial.uniforms.uTime.value = elapsed
      packetMaterial.uniforms.uMotion.value = staticMotion ? 0 : 1
      packetMaterial.uniforms.uOpacity.value = (1 - Math.min(1, shape.dispersion * 1.4)) * (1 - quiet)
      registrationMaterial.opacity = .18 * (1 - Math.min(1, shape.dispersion)) * (1 - quiet)
      coreMaterial.opacity = Math.max(0, 1 - Math.abs(shape.position - 4)) * .7
      core.scale.setScalar(1 + (staticMotion ? 0 : Math.sin(elapsed * 3) * .035))

      const exchangeInfluence = Math.max(0, 1 - Math.abs(shape.position - 4) * 3)
      packets.position.z = chapterDepth * .14 * motionScale * (1 - exchangeInfluence)
      for (let i = 0; i < packetCount; i++) {
        const travel = (packetSeeds[i] + elapsed * (.013 + packetSeeds[i] * .017)) % 1
        const columnFloat = travel * (field.columns - 1)
        const column = Math.floor(columnFloat)
        const next = Math.min(column + 1, field.columns - 1)
        const row = Math.floor(i % 4 * field.rows / 4)
        const a = (column * field.rows + row) * 3
        const b = (next * field.rows + row) * 3
        const t = columnFloat - column
        for (let axis = 0; axis < 3; axis++) packetPositions[i * 3 + axis] = positions[a + axis] + (positions[b + axis] - positions[a + axis]) * t
        if (exchangeInfluence > 0) {
          // A synchronized opposing pair reaches the core as the previous trade exits.
          const cycle = (packetSeeds[Math.floor(i / 3) * 3] + elapsed * .18) % 1
          exchangePacket(i, cycle, exchangePosition)
          for (let axis = 0; axis < 3; axis++) {
            const index = i * 3 + axis
            packetPositions[index] += (exchangePosition[axis] - packetPositions[index]) * exchangeInfluence
          }
        }
      }
      packetPositionAttribute.needsUpdate = true
      try {
        renderer.render(scene, camera)
      } catch {
        element!.dataset.webgl = 'fallback'
        contextLost = true
      }

      // One measured adjustment prevents sustained high GPU cost on modest devices.
      if (adapting && !staticMotion && frameMs < 100) {
        frameCost += frameMs
        frameSamples++
        if (frameSamples === 180) {
          if (frameCost / frameSamples > 24 && dpr > .8) {
            dpr = Math.max(.8, dpr * .75)
            renderer.setPixelRatio(dpr)
            pointsMaterial.uniforms.uDpr.value = dpr
            packetMaterial.uniforms.uDpr.value = dpr
            resize()
          }
          adapting = false
        }
      }
      schedule(staticMotion)
    }

    resize()
    void document.fonts.ready.then(() => { if (!disposed) { identity = sampleIdentity(field.count); dirty = true } })
    window.addEventListener('resize', resize, { passive: true })
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    raf = requestAnimationFrame(frame)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      pointGeometry.dispose()
      wireGeometry.dispose()
      packetGeometry.dispose()
      coreGeometry.dispose()
      registrationGeometry.dispose()
      pointsMaterial.dispose()
      wireMaterial.dispose()
      packetMaterial.dispose()
      coreMaterial.dispose()
      registrationMaterial.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }, [])

  return <div ref={host} className="webgl-world" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}
