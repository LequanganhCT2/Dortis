import React,{useLayoutEffect,useRef} from 'react'
import {scrollCanvasBounds} from './scrollTextMotion'
import {classifyPortfolioBlock,classifyPortfolioPart,blockTravelDirection,portfolioPartDelays} from './blockRevealState'
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
  rootRef,paused=false,sectionsKey='',device='desktop'
}){
  const canvasRef=useRef(null)
  useLayoutEffect(()=>{
    const root=rootRef.current
    const canvas=canvasRef.current
    if(!root||paused||!canvas)return undefined
    const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if(motion?.matches)return undefined
    const sections=Array.from(root.querySelectorAll(':scope > section[id^="pt-"]'))
    if(!sections.length)return undefined

    const host=root.closest('.pt-device')
    const hostStyle=host?window.getComputedStyle(host):null
    const scrollingHost=host&&/auto|scroll/.test(hostStyle?.overflowY||'')&&
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
      section.querySelectorAll('.pt-photo-motion').forEach(node=>{
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
    root.classList.add('pt-site--block-reveal-active')

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
      node.dataset.ptRevealDirection=entryDirection
      if(state==='visible')node.dataset.ptRevealSeen='true'
      node.dataset.ptRevealState=state
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
            markPart(entry.target,entry.isIntersecting?'visible':
              classifyPortfolioPart(entry.boundingClientRect,area.top,area.bottom))
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
      // Resize/scroll fallback for browsers without IntersectionObserver.
      if(!observer&&!fallbackFrame)fallbackFrame=requestAnimationFrame(scan)
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
      }else scan()
    })
    document.addEventListener('scroll',onScroll,{capture:true,passive:true})
    window.addEventListener('resize',onResize,{passive:true})
    const resizeObserver=typeof ResizeObserver==='undefined'?null:
      new ResizeObserver(onResize)
    resizeObserver?.observe(root)
    return ()=>{
      disposed=true
      observer?.disconnect()
      resizeObserver?.disconnect()
      document.removeEventListener('scroll',onScroll,true)
      window.removeEventListener('resize',onResize)
      if(initialFrame)cancelAnimationFrame(initialFrame)
      if(fallbackFrame)cancelAnimationFrame(fallbackFrame)
      if(burstFrame)cancelAnimationFrame(burstFrame)
      bursts.clear()
      root.classList.remove('pt-site--block-reveal-active')
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
  },[rootRef,paused,sectionsKey,device])
  return <canvas ref={canvasRef} className="pt-scroll-text-canvas"
    aria-hidden="true" role="presentation"/>
}
