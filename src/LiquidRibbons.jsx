import { useEffect, useRef } from 'react'

/**
 * A real Three.js/WebGL scene; translucent, twisted ribbon meshes are
 * illuminated with physical clearcoat, transmission and thin-film iridescence.
 * It only animates while visible and falls back to CSS if WebGL is unavailable.
 */
export default function LiquidRibbons({ className = '' }) {
  const host = useRef(null)
  useEffect(() => {
    const element = host.current
    if (!element) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = navigator.connection?.saveData === true
    if (reduce || saveData) return
    let stopped = false
    let cleanup = () => {}
    import('three').then(THREE => {
      if (stopped) return
      let renderer
      try {
        const canvas = document.createElement('canvas')
        canvas.className = 'liquid-webgl-canvas'
        canvas.setAttribute('aria-hidden', 'true')
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
        element.appendChild(canvas)
      } catch {
        element.classList.add('liquid-fallback-only')
        return
      }

      const mobile = window.matchMedia('(max-width: 740px)').matches
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(36, 1, .1, 90)
      camera.position.set(0, 0, mobile ? 17 : 14)
      const group = new THREE.Group()
      scene.add(group)
      scene.add(new THREE.HemisphereLight(0xeafaff, 0xeba8a4, 3.2))
      const lightA = new THREE.PointLight(0xffffff, 85, 35)
      lightA.position.set(-4, 5, 8)
      scene.add(lightA)
      const lightB = new THREE.PointLight(0x46d9ea, 75, 35)
      lightB.position.set(6, -2, 6)
      scene.add(lightB)
      const lightC = new THREE.PointLight(0xffb27c, 48, 35)
      lightC.position.set(1, -5, 3)
      scene.add(lightC)

      const ribbons = []
      const palette = [
        { x: -4.6, phase: .15, hue: .59, width: .92, bend: 1.8 },
        { x: 4.1, phase: 2.15, hue: .49, width: 1.05, bend: 2.0 },
        { x: 3.8, phase: 3.7, hue: .065, width: .52, bend: 1.1 },
      ].slice(0, mobile ? 2 : 3)

      for (const config of palette) {
        const geometry = new THREE.PlaneGeometry(1, 1, 90, 12)
        const colors = new Float32Array(geometry.attributes.position.count * 3)
        const color = new THREE.Color()
        for (let row = 0; row <= 12; row++) {
          for (let col = 0; col <= 90; col++) {
            const s = col / 90
            const v = row / 12
            const fringe = Math.cos(v * Math.PI * 2) * .07
            color.setHSL((config.hue + .08 * Math.sin(6 * s + 7 * v) + fringe + 1) % 1, .49, .68 + .16 * Math.sin(s * 9 + v * 8))
            const i = 3 * (row * 91 + col)
            colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b
          }
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        const material = new THREE.MeshPhysicalMaterial({
          vertexColors: true, side: THREE.DoubleSide,
          metalness: .05, roughness: .07, transmission: .23, thickness: .55,
          ior: 1.42, clearcoat: 1, clearcoatRoughness: .035,
          iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 740],
          transparent: true, opacity: .82, depthWrite: false,
          envMapIntensity: 1.3,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.frustumCulled = false
        group.add(mesh)
        ribbons.push({ geometry, material, config })
      }

      const orbGeometry = new THREE.SphereGeometry(.88, 40, 30)
      const orbMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc8f4fc, transmission: .75, thickness: 1.8, roughness: .06,
        ior: 1.5, clearcoat: 1, iridescence: .92, iridescenceIOR: 1.32,
        iridescenceThicknessRange: [220, 950], transparent: true, opacity: .69,
      })
      const orb = new THREE.Mesh(orbGeometry, orbMaterial)
      orb.position.set(3.0, .5, 1.9)
      group.add(orb)

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.05 : 1.5))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.42
      const updateSize = () => {
        const rect = element.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) return
        renderer.setSize(rect.width, rect.height, false)
        camera.aspect = rect.width / rect.height
        camera.updateProjectionMatrix()
      }
      updateSize()
      const observer = new ResizeObserver(updateSize)
      observer.observe(element)
      let inView = false
      let frame = 0
      let last = 0
      let scrolling = 0
      let mouseX = 0
      let mouseY = 0
      const pointer = e => {
        const rect = element.getBoundingClientRect()
        mouseX = ((e.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2
        mouseY = ((e.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2
      }
      const onScroll = () => {
        const rect = element.getBoundingClientRect()
        scrolling = THREE.MathUtils.clamp(-rect.top / Math.max(rect.height, 1), 0, 1)
      }
      const render = ms => {
        frame = 0
        if (!inView || document.hidden || stopped) return
        frame = requestAnimationFrame(render)
        if (ms - last < (mobile ? 33 : 22)) return
        last = ms
        const t = ms * .00025
        ribbons.forEach(({ geometry, config }, index) => {
          const a = geometry.attributes.position
          for (let row = 0; row <= 12; row++) {
            const v = row / 12 - .5
            for (let col = 0; col <= 90; col++) {
              const s = col / 90
              const curl = s * Math.PI * 2.7 + config.phase + t * .38
              const width = config.width * (.85 + .3 * Math.sin(s * 6 + config.phase))
              const ax = config.x + Math.sin(s * Math.PI * 2 + config.phase + t * .25) * config.bend
              const az = .55 * Math.cos(s * Math.PI * 3 + config.phase + t * .18)
              const x = ax + Math.cos(curl) * v * width * 2.8
              const y = (s - .5) * 11.6 + .28 * Math.sin(s * 9 + index + t)
              const z = az + Math.sin(curl) * v * width * 2.8
              a.setXYZ(row * 91 + col, x, y, z)
            }
          }
          a.needsUpdate = true
          geometry.computeVertexNormals()
        })
        group.rotation.z = Math.sin(t * .32) * .045 + scrolling * .15 - mouseX * .015
        group.rotation.y = mouseX * .075 + Math.sin(t * .27) * .07
        group.rotation.x = -mouseY * .035
        group.position.y = scrolling * -1.05
        orb.position.y = .5 + Math.sin(t * 1.4) * .28
        orb.rotation.y += .002
        renderer.render(scene, camera)
      }
      const inViewport = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting
        if (inView && !frame && !document.hidden) frame = requestAnimationFrame(render)
        if (!inView && frame) { cancelAnimationFrame(frame); frame = 0 }
      }, { rootMargin: '80px' })
      inViewport.observe(element)
      window.addEventListener('pointermove', pointer, { passive: true })
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
      const visibility = () => { if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0 } else if (!document.hidden && inView && !frame) frame = requestAnimationFrame(render) }
      document.addEventListener('visibilitychange', visibility)
      element.classList.add('liquid-webgl-ready')
      cleanup = () => {
        observer.disconnect()
        inViewport.disconnect()
        window.removeEventListener('pointermove', pointer)
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', visibility)
        cancelAnimationFrame(frame)
        ribbons.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose() })
        orbGeometry.dispose(); orbMaterial.dispose()
        renderer.dispose()
        canvas.remove()
      }
    }).catch(() => { if (!stopped) element.classList.add('liquid-fallback-only') })
    return () => { stopped = true; cleanup() }
  }, [])
  return <div className={'liquid-stage ' + className} aria-hidden="true">
    <div className="liquid-static-ribbon liquid-static-ribbon-left" />
    <div className="liquid-static-ribbon liquid-static-ribbon-right" />
    <div className="liquid-static-orb" />
  </div>
}
