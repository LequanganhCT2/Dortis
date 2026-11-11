import { useEffect, useRef } from 'react'
import './cax-hero-copy.css'
import {copyFor} from './siteContent'

/**
 * Dortis Hero — typographic 3D interaction.
 * Isolated from the adjacent CaxHeroDeck so its geometry and controls
 * stay exactly as they are. Uses only transform/opacity for motion.
 */
export default function CaxHeroCopy({content={}}) {
  const copyText=copyFor(content,'hero')
  const frame = useRef(0)
  const copy = useRef(null)

  useEffect(() => () => {
    if (frame.current) window.cancelAnimationFrame(frame.current)
  }, [])

  const resetDepth = () => {
    if (frame.current) window.cancelAnimationFrame(frame.current)
    frame.current = 0
    const node = copy.current
    if (!node) return
    node.style.setProperty('--hero-rx', '0deg')
    node.style.setProperty('--hero-ry', '0deg')
    node.style.setProperty('--hero-shift-x', '0px')
    node.style.setProperty('--hero-shift-y', '0px')
  }

  const handlePointerMove = event => {
    if (event.pointerType !== 'mouse') return
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    if (frame.current) window.cancelAnimationFrame(frame.current)
    frame.current = window.requestAnimationFrame(() => {
      const node = copy.current
      if (!node) return
      node.style.setProperty('--hero-rx', (-y * 2.6).toFixed(2) + 'deg')
      node.style.setProperty('--hero-ry', (x * 3.2).toFixed(2) + 'deg')
      node.style.setProperty('--hero-shift-x', (x * 4).toFixed(1) + 'px')
      node.style.setProperty('--hero-shift-y', (y * 3).toFixed(1) + 'px')
      frame.current = 0
    })
  }

  return <div ref={copy} className="cax-hero-copy cax-hero-type"
      onPointerMove={handlePointerMove} onPointerLeave={resetDepth}>
    <p className="cax-kicker cax-hero-type__kicker">
      <span className="cax-hero-type__spark" aria-hidden="true">✳</span>
      {copyText.kicker}
    </p>
    <h1 className="cax-hero-type__title">
      {copyText.before} <span className="cax-hero-type__accent cobalt">{copyText.artist}</span><br/>
      {copyText.action} <span className="cax-hero-type__accent teal">{copyText.quality}</span>{' '}
      {copyText.tail} <span className="cax-hero-type__accent ember">{copyText.impact}</span>
    </h1>
    <div className="cax-hero-type__rule" aria-hidden="true"><span/><span/><span/></div>
    <p className="cax-lead cax-hero-type__lead">
      {copyText.description}
    </p>
    <div className="cax-hero-actions cax-hero-type__actions">
      <a href="#dich-vu" className="button-dark">
        {copyText.primaryButton} <span className="cax-hero-type__button-arrow" aria-hidden="true">↗</span>
      </a>
      <a href="#trai-nghiem" className="button-outline">
        {copyText.secondaryButton} <span className="cax-hero-type__button-arrow" aria-hidden="true">↗</span>
      </a>
    </div>
    <p className="cax-hero-bottomline cax-hero-type__signature">
      <span>{copyText.signature.split(' — ')[0]}</span>
      <span className="cax-hero-type__signature-line" aria-hidden="true"/>
      <span>{copyText.signature.split(' — ')[1]||''}</span>
    </p>
  </div>
}
