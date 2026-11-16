import React,{useEffect,useId,useRef} from 'react'
import {
  photoMotionSetting,photoPointerOffsets
} from './photoMotionConfig'
import './photo-motion.css'

/**
 * Animate image pixels, not their draggable/resizeable grid/layer geometry.
 * Pointer updates write CSS variables through one RAF, never React state.
 * Transform is isolated from parent translate/scale, so Admin edits survive.
 */
export default function PhotoMotion({
  asset,paused=false,revealOrder=0,children
}){
  const host=useRef(null),frame=useRef(0),pending=useRef(null)
  const svgId='pt-water-'+useId().replace(/:/g,'')
  const {mode,intensity,pointer}=photoMotionSetting(asset)
  const enabled=!paused&&mode!=='still'&&intensity>0
  const power=Math.max(0,Math.min(1,intensity/100))
  const wave=enabled&&mode==='wave'
  const waveLow=(3+Math.round(power*5)).toString()
  const waveHigh=(6+Math.round(power*13)).toString()
  const apply=values=>{
    const element=host.current
    if(!element)return
    element.style.setProperty('--pm-rx',values.rx)
    element.style.setProperty('--pm-ry',values.ry)
    element.style.setProperty('--pm-x',values.x)
    element.style.setProperty('--pm-y',values.y)
    element.style.setProperty('--pm-lx',values.lx)
    element.style.setProperty('--pm-ly',values.ly)
  }
  const reset=()=>{
    if(frame.current){cancelAnimationFrame(frame.current);frame.current=0}
    pending.current=null
    apply(photoPointerOffsets(mode,0,0,intensity))
  }
  useEffect(()=>{
    const element=host.current
    if(!element)return
    if(!enabled){
      element.classList.remove('is-photo-visible')
      reset()
      return
    }
    if(typeof IntersectionObserver==='undefined'){
      element.classList.add('is-photo-visible')
      return
    }
    const observer=new IntersectionObserver(([entry])=>{
      element.classList.toggle('is-photo-visible',Boolean(entry?.isIntersecting))
    },{rootMargin:'120px 0px'})
    observer.observe(element)
    return ()=>{
      observer.disconnect()
      if(frame.current){cancelAnimationFrame(frame.current);frame.current=0}
    }
  },[enabled])
  useEffect(()=>()=>{
    if(frame.current)cancelAnimationFrame(frame.current)
  },[])
  function handleMove(event){
    if(!enabled||!pointer||event.pointerType!=='mouse')return
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
    const rect=event.currentTarget.getBoundingClientRect()
    if(rect.width<1||rect.height<1)return
    const x=((event.clientX-rect.left)/rect.width-.5)*2
    const y=((event.clientY-rect.top)/rect.height-.5)*2
    pending.current=photoPointerOffsets(mode,x,y,intensity)
    if(frame.current)return
    frame.current=requestAnimationFrame(()=>{
      frame.current=0
      if(pending.current)apply(pending.current)
    })
  }
  return <div ref={host}
    className={'pt-photo-motion pt-photo-motion--'+mode+
      (enabled?'':' is-photo-paused')}
    data-photo-motion={mode}
    data-pt-scroll-reveal="image"
    data-pt-reveal-order={revealOrder}
    style={{
      '--pm-amp':(power*14).toFixed(2)+'px',
      '--pm-orbit':(power*9).toFixed(2)+'px',
      '--pm-turn':(power*2.4).toFixed(2)+'deg',
      '--pm-breath':(1+power*.055).toFixed(4),
      '--pm-rx':'0deg','--pm-ry':'0deg','--pm-x':'0px','--pm-y':'0px',
      '--pm-lx':'50%','--pm-ly':'50%',
      '--pm-wave-filter':'url(#'+svgId+')'
    }}
    onPointerMove={pointer?handleMove:undefined}
    onPointerLeave={pointer?reset:undefined}
    onPointerCancel={pointer?reset:undefined}>
    {wave&&<svg className="pt-photo-motion__filters" width="0" height="0"
      aria-hidden="true" focusable="false">
      <defs><filter id={svgId} x="-7%" y="-7%" width="114%" height="114%"
        colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.027"
          numOctaves="2" seed="7" result="water-noise">
          <animate attributeName="baseFrequency"
            values="0.006 0.027;0.009 0.034;0.006 0.027"
            dur="10s" repeatCount="indefinite"/>
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="water-noise"
          scale={waveLow} xChannelSelector="R" yChannelSelector="G">
          <animate attributeName="scale"
            values={waveLow+';'+waveHigh+';'+waveLow}
            dur="7s" repeatCount="indefinite"/>
        </feDisplacementMap>
      </filter></defs>
    </svg>}
    <div className="pt-photo-motion__hover">
      <div className="pt-photo-motion__animated">
        {children}
      </div>
    </div>
  </div>
}
