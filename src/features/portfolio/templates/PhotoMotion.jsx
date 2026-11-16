import React,{useEffect,useRef} from 'react'
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
  asset,paused=false,children
}){
  const host=useRef(null),frame=useRef(0),pending=useRef(null)
  const {mode,intensity,pointer}=photoMotionSetting(asset)
  const enabled=!paused&&mode!=='still'&&intensity>0
  const power=Math.max(0,Math.min(1,intensity/100))
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
    style={{
      '--pm-amp':(power*14).toFixed(2)+'px',
      '--pm-orbit':(power*9).toFixed(2)+'px',
      '--pm-turn':(power*2.4).toFixed(2)+'deg',
      '--pm-breath':(1+power*.055).toFixed(4),
      '--pm-rx':'0deg','--pm-ry':'0deg','--pm-x':'0px','--pm-y':'0px',
      '--pm-lx':'50%','--pm-ly':'50%'
    }}
    onPointerMove={handleMove} onPointerLeave={reset}
    onPointerCancel={reset}>
    <div className="pt-photo-motion__hover">
      <div className="pt-photo-motion__animated">
        {children}
      </div>
    </div>
  </div>
}
