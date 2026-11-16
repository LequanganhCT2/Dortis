import React,{useEffect,useRef} from 'react'
import {scrollCanvasBounds,scrollRevealEnvelope,scrollTextPose,scrollImagePose} from './scrollTextMotion'
import './scroll-text-atmosphere.css'

/**
 * One lightweight canvas for the entire Portfolio, synchronized to scroll.
 * Text itself remains real, accessible DOM (never rasterized into Canvas).
 * No per-frame React state, no WebGL, and no large document-height bitmap.
 */
export default function ScrollTextAtmosphere({
  rootRef,paused=false,sectionsKey='',device='desktop'
}){
  const canvasRef=useRef(null)
  useEffect(()=>{
    const root=rootRef.current,canvas=canvasRef.current
    if(!root||!canvas||paused)return undefined
    const media=window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if(media?.matches)return undefined
    const context=canvas.getContext('2d',{alpha:true})
    if(!context)return undefined
    const fields=Array.from(root.querySelectorAll('[data-pt-scroll-reveal]'))
      .filter(node=>node.dataset.ptScrollReveal==='image'||
        Boolean(node.textContent?.trim()))
    if(!fields.length)return undefined

    root.classList.add('pt-site--scroll-text-active')
    let frame=0,disposed=false
    let width=0,height=0

    function drawGlints(glints,viewportTop,contentWidth){
      if(!width||!height)return
      context.clearRect(0,0,width,height)
      // Limit canvas work to a handful of visible titles per scroll frame.
      for(const point of glints.slice(0,3)){
        const x=Math.max(0,Math.min(width,point.x))
        const y=point.y-viewportTop
        if(y<0||y>height||point.opacity<=0)continue
        context.save()
        context.globalAlpha=point.opacity*.32
        const radius=Math.min(165,Math.max(54,contentWidth*.085))
        const halo=context.createRadialGradient(x,y,3,x,y,radius)
        halo.addColorStop(0,'rgba(255,234,167,.68)')
        halo.addColorStop(.18,'rgba(255,197,118,.22)')
        halo.addColorStop(1,'rgba(255,181,94,0)')
        context.fillStyle=halo
        context.beginPath()
        context.arc(x,y,radius,0,Math.PI*2)
        context.fill()
        context.strokeStyle='rgba(255,231,165,.64)'
        context.lineWidth=.75
        for(let n=0;n<3;n++){
          const offset=n*19
          context.globalAlpha=point.opacity*(.16-n*.036)
          context.beginPath()
          context.ellipse(x,y,radius*.47+offset,radius*.13+offset*.24,-.19,0,Math.PI*2)
          context.stroke()
        }
        for(let n=0;n<7;n++){
          const angle=(n*2.399963)+(point.progress*1.1)
          const dist=(20+n*8)*Math.min(1,contentWidth/700)
          context.globalAlpha=point.opacity*(.16+(n%3)*.065)
          context.fillStyle=n%2?'#fff3c5':'#f6c57c'
          context.beginPath()
          context.arc(x+Math.cos(angle)*dist,y+Math.sin(angle)*dist,1+(n%3)*.5,0,Math.PI*2)
          context.fill()
        }
        context.restore()
      }
    }
    function update(){
      frame=0
      if(disposed)return
      const rootRect=root.getBoundingClientRect()
      const hostRect=root.closest('.pt-device')?.getBoundingClientRect()
      const bounds=scrollCanvasBounds(rootRect,hostRect,window.innerHeight)
      // The canvas is viewport-sized and follows the visible slice of the
      // long Portfolio rather than allocating a full-length bitmap.
      const cssWidth=Math.max(1,Math.round(rootRect.width))
      const cssHeight=Math.max(1,Math.round(bounds.height))
      const dpr=Math.min(window.devicePixelRatio||1,1.5)
      const pxWidth=Math.round(cssWidth*dpr),pxHeight=Math.round(cssHeight*dpr)
      canvas.style.width=cssWidth+'px'
      canvas.style.height=cssHeight+'px'
      canvas.style.transform='translate3d(0,'+bounds.localY.toFixed(1)+'px,0)'
      if(canvas.width!==pxWidth||canvas.height!==pxHeight){
        canvas.width=pxWidth;canvas.height=pxHeight
        context.setTransform(dpr,0,0,dpr,0,0)
      }
      width=cssWidth;height=cssHeight
      const decorations=[]
      // Measure every element before writing CSS variables to avoid
      // layout thrashing. Image geometry comes from its stable outer slot,
      // not the inner 3D transform currently applied to PhotoMotion.
      const measurements=fields.map(element=>{
        const kind=element.dataset.ptScrollReveal||'body'
        const anchor=kind==='image'?element.parentElement||element:element
        return {element,kind,rect:anchor.getBoundingClientRect()}
      })
      for(const {element,kind,rect} of measurements){
        const order=kind==='image'?Number(element.dataset.ptRevealOrder)||0:
          kind==='title'?1:kind==='body'?2:0
        const envelope=scrollRevealEnvelope(
          rect.top,rect.bottom,bounds.top,bounds.bottom,kind,order)
        const {progress}=envelope
        if(kind==='image'){
          const pose=scrollImagePose(progress,envelope)
          element.style.setProperty('--pt-media-alpha',String(pose.alpha))
          element.style.setProperty('--pt-media-scale',pose.scale)
          element.style.setProperty('--pt-media-rise',pose.rise)
          element.style.setProperty('--pt-media-tilt',pose.tilt)
          element.style.setProperty('--pt-media-blur',pose.blur)
          element.style.setProperty('--pt-media-glow',String(pose.glow))
          continue
        }
        const pose=scrollTextPose(progress,kind,envelope)
        element.style.setProperty('--pt-scroll-alpha',String(pose.alpha))
        element.style.setProperty('--pt-scroll-rise',pose.rise)
        element.style.setProperty('--pt-scroll-tilt',pose.tilt)
        element.style.setProperty('--pt-scroll-depth',pose.depth)
        element.style.setProperty('--pt-scroll-clip',pose.clip)
        element.style.setProperty('--pt-scroll-clip-top',pose.clipTop)
        element.style.setProperty('--pt-scroll-clip-bottom',pose.clipBottom)
        element.style.setProperty('--pt-scroll-glow',String(pose.glow))
        if(kind==='title'&&progress>.10&&rect.bottom>bounds.top&&rect.top<bounds.bottom){
          decorations.push({
            x:Math.min(rect.right-rootRect.left-12,Math.max(18,rect.left-rootRect.left+rect.width*.71)),
            y:Math.max(bounds.top,rect.top)+Math.min(rect.height*.3,42),
            opacity:Math.sin(Math.PI*Math.min(1,progress))*.65,
            progress
          })
        }
      }
      if(!bounds.height){context.clearRect(0,0,width,height);return}
      drawGlints(decorations,bounds.top,cssWidth)
    }
    function schedule(){
      if(!frame&&!disposed)frame=requestAnimationFrame(update)
    }
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule)
    observer?.observe(root)
    const handleMotion=()=>{
      if(media?.matches)disable()
      else{
        root.classList.add('pt-site--scroll-text-active')
        schedule()
      }
    }
    function disable(){
      root.classList.remove('pt-site--scroll-text-active')
      context.clearRect(0,0,width,height)
    }
    document.addEventListener('scroll',schedule,{capture:true,passive:true})
    window.addEventListener('resize',schedule,{passive:true})
    media?.addEventListener?.('change',handleMotion)
    schedule()
    return ()=>{
      disposed=true
      if(frame)cancelAnimationFrame(frame)
      document.removeEventListener('scroll',schedule,true)
      window.removeEventListener('resize',schedule)
      media?.removeEventListener?.('change',handleMotion)
      observer?.disconnect()
      root.classList.remove('pt-site--scroll-text-active')
      for(const field of fields){
        for(const property of ['--pt-scroll-alpha','--pt-scroll-rise','--pt-scroll-tilt',
          '--pt-scroll-depth','--pt-scroll-clip','--pt-scroll-clip-top',
          '--pt-scroll-clip-bottom','--pt-scroll-glow',
          '--pt-media-alpha','--pt-media-scale','--pt-media-rise',
          '--pt-media-tilt','--pt-media-blur','--pt-media-glow']){
          field.style.removeProperty(property)
        }
      }
      context.clearRect(0,0,width,height)
    }
  },[rootRef,paused,sectionsKey,device])
  return <canvas ref={canvasRef} className="pt-scroll-text-canvas"
    aria-hidden="true" role="presentation"/>
}
