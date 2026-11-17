import React,{useLayoutEffect,useRef} from 'react'
import {scrollCanvasBounds} from './scrollTextMotion'
import {classifyPortfolioBlock,classifyPortfolioPart,blockTravelDirection,portfolioPartDelays,normalizeRevealSpeed,scaledRevealMs} from './blockRevealState'
import './scroll-text-atmosphere.css'

/**
 * Section-based Portfolio reveal. One IntersectionObserver triggers each
 * section once. Within that section the label, title, description and photos
 * appear as separately timed layers, never scrubbed by individual pixels.
 *
 * Canvas is decorative only: one short-lived, viewport-sized gold glint
 * behind newly opened sections. Text and photos remain normal DOM layers.
 */
export default function ScrollTextAtmosphere({
  rootRef,paused=false,sectionsKey='',device='desktop',speed=.8,publicPage=false,
  forceMotion=false
}){
  const canvasRef=useRef(null)
  useLayoutEffect(()=>{
    const root=rootRef.current
    const canvas=canvasRef.current
    if(!root||paused||!canvas)return undefined
    const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)')
    // Respect reduced-motion by default. An explicit Play action can opt in.
    if(motion?.matches&&!forceMotion)return undefined
    const pace=normalizeRevealSpeed(speed)
    const ms=value=>scaledRevealMs(value,pace)
    const sections=Array.from(root.querySelectorAll(':scope > section[id^="pt-"]'))
    if(!sections.length)return undefined

    const host=root.closest('.pt-device')
    const hostStyle=host?window.getComputedStyle(host):null
    // Published websites scroll the window; Admin previews scroll .pt-device.
    // Explicitly select the public viewport instead of guessing from CSS.
    const scrollingHost=!publicPage&&host&&/auto|scroll/.test(hostStyle?.overflowY||'')&&
      host.scrollHeight>host.clientHeight+8?host:null
    const currentScroll=()=>scrollingHost?scrollingHost.scrollTop:
      window.scrollY||document.documentElement.scrollTop||0
    const viewport=()=>{
      const rect=scrollingHost?.getBoundingClientRect()
      return {
        top:Math.max(0,rect?.top||0),
        bottom:Math.min(window.innerHeight,rect?.bottom??window.innerHeight)
      }
    }
    // Animate visible content on inner layers only. Saved layer transforms,
    // portrait crops, font sizes and user-defined opacity stay on their parents.
    const revealParts=[]
    const trackedParts=new Set()
    for(const section of sections){
      let bodyIndex=0,photoIndex=0
      const register=(node,kind,index=0)=>{
        const {enter,exit}=portfolioPartDelays(kind,index)
        node.dataset.ptRevealPart=kind
        trackedParts.add(node)
        node.style.setProperty('--pt-reveal-delay',enter+'ms')
        node.style.setProperty('--pt-reveal-exit-delay',exit+'ms')
        revealParts.push(node)
      }
      section.querySelectorAll('[data-pt-scroll-reveal]').forEach(node=>{
        const kind=node.dataset.ptScrollReveal
        if(kind==='eyebrow'||kind==='title'||kind==='body'){
          register(node,kind,kind==='body'?bodyIndex++:0)
        }
      })
      // Observe an independent photo wrapper. Moving the PhotoMotion node
      // alone did not reveal the visible tile/frame, and legacy image CSS
      // could suppress transforms on the actual <img>.
      section.querySelectorAll('.pt-photo-reveal').forEach(node=>{
        register(node,'image',photoIndex++)
      })
      // Compatibility for layouts created before PhotoReveal was introduced.
      section.querySelectorAll('.pt-photo-motion').forEach(node=>{
        if(node.closest('.pt-photo-reveal'))return
        register(node,'image',photoIndex++)
      })
      // Empty image tiles also reveal; do not animate a saved drag/scale frame
      // when an actual PhotoMotion child already handles the image.
      section.querySelectorAll(
        '.pt-ribbon__tile--empty,.pt-site__media-tile.is-empty,.pt-artboard__layer.is-image'
      ).forEach(node=>{
        if(node.querySelector('.pt-photo-motion'))return
        register(node,'image',photoIndex++)
      })
    }
    const ctx=canvas.getContext('2d',{alpha:true})
    let lastScroll=currentScroll()
    let direction='down'
    let disposed=false
    let burstFrame=0
    let initialFrame=0
    let fallbackFrame=0
    const bursts=new Map()
    root.style.setProperty('--pt-reveal-duration',ms(330)+'ms')
    root.style.setProperty('--pt-reveal-image-duration',ms(390)+'ms')
    root.style.setProperty('--pt-reveal-letter-duration',ms(330)+'ms')
    root.style.setProperty('--pt-reveal-exit-duration',ms(180)+'ms')
    root.classList.add('pt-site--block-reveal-active')
    // WAAPI is explicit and is not suppressed by legacy CSS animation rules.
    // The CSS-only state animations remain as a fallback for older browsers.
    const hasWebAnimations=typeof Element!=='undefined'&&
      typeof Element.prototype.animate==='function'
    if(hasWebAnimations)root.classList.add('pt-site--waapi-reveal')
    const activeAnimations=new Map()
    function stopPartAnimations(node){
      const current=activeAnimations.get(node)||[]
      current.forEach(animation=>animation.cancel())
      activeAnimations.delete(node)
    }
    function animatePart(node,state){
      if(!hasWebAnimations)return
      stopPartAnimations(node)
      const list=[]
      const start=(target,frames,options)=>{
        const animation=target.animate(frames,{
          fill:'both',...options,
          duration:ms(options.duration),
          delay:ms(options.delay||0)
        })
        list.push(animation)
        animation.onfinish=()=>{animation.cancel()}
      }
      const kind=node.dataset.ptRevealPart
      if(state==='visible'){
        const letters=node.querySelectorAll('.pt-burst-letter')
        const words=node.querySelectorAll('.pt-burst-word[data-pt-burst-word]')
        if(letters.length){
          letters.forEach((letter,index)=>{
            start(letter,[
              {opacity:0,transform:'translate3d(0,15px,-12px) rotateX(-28deg) scale(.72)'},
              {opacity:1,transform:'translate3d(0,-2px,2px) rotateX(2deg) scale(1.04)',offset:.74},
              {opacity:1,transform:'none'}
            ],{duration:300,delay:Math.min(240,index*11),
              easing:'cubic-bezier(.18,.85,.27,1)'})
          })
        }else if(kind==='body'&&words.length){
          words.forEach((word,index)=>start(word,[
            {opacity:0,transform:'translate3d(0,12px,0) scale(.97)'},
            {opacity:1,transform:'translate3d(0,-1px,0) scale(1.005)',offset:.75},
            {opacity:1,transform:'none'}
          ],{duration:320,delay:Math.min(650,index*24),
            easing:'cubic-bezier(.16,.87,.26,1)'}))
        }else if(kind==='image'&&
          (node.classList.contains('pt-photo-reveal')||
            node.classList.contains('pt-photo-motion'))){
          start(node,[
            {opacity:0,transform:'translate3d(0,42px,0) scale(.88)'},
            {opacity:.85,transform:'translate3d(0,-5px,0) scale(1.025)',offset:.68},
            {opacity:1,transform:'none'}
          ],{duration:560,delay:Number.parseFloat(
            node.style.getPropertyValue('--pt-reveal-delay'))||0,
            easing:'cubic-bezier(.18,.85,.25,1)'})
        }else if(kind==='image'){
          // Missing-photo placeholders reveal without moving draggable tiles.
          start(node,[{opacity:0,clipPath:'inset(20% 15% 20% 15%)'},
            {opacity:1,clipPath:'inset(0% 0% 0% 0%)'}],
            {duration:420,easing:'ease-out'})
        }else{
          // Never override user-authored layer transforms/scale/position.
          // Fallback for very long descriptions: a visible lift, not an
          // imperceptible opacity-only change, but never affect text frames.
          const target=kind==='body'?
            [{opacity:0,filter:'blur(5px)'},{opacity:1,filter:'blur(0px)'}]:
            [{opacity:0},{opacity:1}]
          start(node,target,{
            duration:kind==='body'?430:340,easing:'ease-out'})
        }
      }else{
        start(node,[{opacity:1},{opacity:0}],{
          duration:165,easing:'ease-out'})
      }
      activeAnimations.set(node,list)
    }

    function drawGoldBurst(now){
      burstFrame=0
      if(disposed||!ctx||!bursts.size)return
      const rootRect=root.getBoundingClientRect()
      const hostRect=scrollingHost?.getBoundingClientRect()
      const bounds=scrollCanvasBounds(rootRect,hostRect,window.innerHeight)
      const width=Math.max(1,Math.ceil(rootRect.width))
      const height=Math.max(1,Math.ceil(bounds.height))
      const dpr=Math.min(1.5,window.devicePixelRatio||1)
      canvas.style.width=width+'px'
      canvas.style.height=height+'px'
      canvas.style.transform='translate3d(0,'+bounds.localY.toFixed(1)+'px,0)'
      if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){
        canvas.width=Math.round(width*dpr)
        canvas.height=Math.round(height*dpr)
        ctx.setTransform(dpr,0,0,dpr,0,0)
      }
      ctx.clearRect(0,0,width,height)
      if(bounds.height>0){
        for(const [section,start] of bursts){
          const age=now-start
          if(age>520){bursts.delete(section);continue}
          const target=section.querySelector('.pt-ribbon__copy h2, .pt-site__copy h2, .pt-artboard__layer.is-text')
          const rect=(target||section).getBoundingClientRect()
          if(rect.bottom<bounds.top||rect.top>bounds.bottom)continue
          const x=Math.max(0,Math.min(width,rect.left-rootRect.left+rect.width*.5))
          const y=Math.max(0,Math.min(height,rect.top-bounds.top+Math.min(rect.height*.38,80)))
          const progress=Math.max(0,Math.min(1,age/520))
          const alpha=Math.sin(Math.PI*progress)*.16
          const radius=Math.min(145,Math.max(65,rootRect.width*.08))
          ctx.save()
          ctx.globalAlpha=alpha
          const gradient=ctx.createRadialGradient(x,y,3,x,y,radius)
          gradient.addColorStop(0,'rgba(255,240,197,.65)')
          gradient.addColorStop(.26,'rgba(255,198,113,.22)')
          gradient.addColorStop(1,'rgba(255,190,106,0)')
          ctx.fillStyle=gradient
          ctx.beginPath()
          ctx.arc(x,y,radius,0,Math.PI*2)
          ctx.fill()
          ctx.restore()
        }
      }
      if(bursts.size)burstFrame=requestAnimationFrame(drawGoldBurst)
    }
    function mark(section,state,entryDirection=direction){
      if(section.dataset.ptBlockState===state)return
      delete section.dataset.ptBlockPrime
      section.dataset.ptBlockDirection=entryDirection
      section.dataset.ptBlockState=state
      if(state==='visible'&&ctx&&device!=='mobile'){
        bursts.set(section,performance.now())
        if(!burstFrame)burstFrame=requestAnimationFrame(drawGoldBurst)
      }
    }
    function markPart(node,state,entryDirection=direction){
      if(node.dataset.ptRevealState===state)return
      const wasSeen=node.dataset.ptRevealSeen==='true'
      node.dataset.ptRevealDirection=entryDirection
      if(state==='visible')node.dataset.ptRevealSeen='true'
      node.dataset.ptRevealState=state
      if(state==='visible'||wasSeen)animatePart(node,state)
    }
    const box=viewport()
    const visibleInitially=[]
    for(const section of sections){
      const state=classifyPortfolioBlock(section.getBoundingClientRect(),box.top,box.bottom)
      // Prime all parts fully hidden to avoid a flash before their first
      // staged entrance, including after opening a URL mid-portfolio.
      section.dataset.ptBlockPrime='true'
      section.dataset.ptBlockState=state==='visible'?'hidden-bottom':state
      section.dataset.ptBlockDirection='down'
      if(state==='visible')visibleInitially.push(section)
    }
    // Element states are applied before paint to avoid offscreen flashing.
    for(const part of revealParts){
      markPart(part,classifyPortfolioPart(part.getBoundingClientRect(),
        box.top,box.bottom),'down')
    }
    const changeDirection=()=>{
      const next=currentScroll()
      direction=blockTravelDirection(lastScroll,next,direction)
      lastScroll=next
    }
    const observer=typeof IntersectionObserver==='undefined'?null:
      new IntersectionObserver(entries=>{
        if(disposed)return
        changeDirection()
        const area=viewport()
        for(const entry of entries){
          if(trackedParts.has(entry.target)){
            markPart(entry.target,classifyPortfolioPart(entry.target.getBoundingClientRect(),
              area.top,area.bottom))
          }else{
            mark(entry.target,classifyPortfolioBlock(entry.boundingClientRect,
              area.top,area.bottom))
          }
        }
      },{
        root:scrollingHost,
        rootMargin:'-3% 0px -3% 0px',
        threshold:0
      })
    function scan(){
      fallbackFrame=0
      if(disposed)return
      const area=viewport()
      for(const section of sections){
        mark(section,classifyPortfolioBlock(section.getBoundingClientRect(),
          area.top,area.bottom))
      }
      for(const part of revealParts){
        markPart(part,classifyPortfolioPart(part.getBoundingClientRect(),
          area.top,area.bottom))
      }
    }
    function onScroll(){
      changeDirection()
      // Explicitly scan the embedded editor scroll container every frame of
      // movement, even when IntersectionObserver does not deliver callbacks.
      if(!fallbackFrame)fallbackFrame=requestAnimationFrame(scan)
    }
    function onResize(){
      if(!fallbackFrame)fallbackFrame=requestAnimationFrame(scan)
    }
    initialFrame=requestAnimationFrame(()=>{
      initialFrame=0
      for(const section of visibleInitially)mark(section,'visible','down')
      if(observer){
        sections.forEach(section=>observer.observe(section))
        revealParts.forEach(part=>observer.observe(part))
      }
      scan()
    })
    document.addEventListener('scroll',onScroll,{capture:true,passive:true})
    scrollingHost?.addEventListener('scroll',onScroll,{passive:true})
    // Browsers differ in whether document captures window scroll events.
    // Explicit window scroll is mandatory on the published route.
    window.addEventListener('scroll',onScroll,{passive:true})
    window.addEventListener('pageshow',onResize)
    document.addEventListener('visibilitychange',onResize)
    window.addEventListener('resize',onResize,{passive:true})
    const resizeObserver=typeof ResizeObserver==='undefined'?null:
      new ResizeObserver(onResize)
    resizeObserver?.observe(root)
    return ()=>{
      disposed=true
      observer?.disconnect()
      resizeObserver?.disconnect()
      document.removeEventListener('scroll',onScroll,true)
      scrollingHost?.removeEventListener('scroll',onScroll)
      window.removeEventListener('scroll',onScroll)
      window.removeEventListener('pageshow',onResize)
      document.removeEventListener('visibilitychange',onResize)
      window.removeEventListener('resize',onResize)
      if(initialFrame)cancelAnimationFrame(initialFrame)
      if(fallbackFrame)cancelAnimationFrame(fallbackFrame)
      if(burstFrame)cancelAnimationFrame(burstFrame)
      bursts.clear()
      root.style.removeProperty('--pt-reveal-duration')
      root.style.removeProperty('--pt-reveal-image-duration')
      root.style.removeProperty('--pt-reveal-letter-duration')
      root.style.removeProperty('--pt-reveal-exit-duration')
      root.classList.remove('pt-site--block-reveal-active')
      root.classList.remove('pt-site--waapi-reveal')
      for(const node of activeAnimations.keys())stopPartAnimations(node)
      sections.forEach(section=>{
        delete section.dataset.ptBlockState
        delete section.dataset.ptBlockDirection
        delete section.dataset.ptBlockPrime
      })
      revealParts.forEach(node=>{
        delete node.dataset.ptRevealPart
        delete node.dataset.ptRevealState
        delete node.dataset.ptRevealDirection
        delete node.dataset.ptRevealSeen
        node.style.removeProperty('--pt-reveal-delay')
        node.style.removeProperty('--pt-reveal-exit-delay')
      })
      if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height)
    }
  },[rootRef,paused,sectionsKey,device,speed,publicPage,forceMotion])
  return <canvas ref={canvasRef} className="pt-scroll-text-canvas"
    aria-hidden="true" role="presentation"/>
}
