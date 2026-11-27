import {useLayoutEffect} from 'react'

const FRAMES='.pt-studio-layer,.pt-artboard__layer,.pt-ribbon__tile,.pt-site__media-tile,[data-portfolio-movable],[data-portfolio-text-frame]'

/** Reserve document space for authored layers that sit outside normal flow.
 * A trailing margin keeps percentage-based canvas coordinates stable while
 * moving the following section below overflowing content. */
export default function usePortfolioContentFlow(rootRef){
  useLayoutEffect(()=>{
    const root=rootRef.current
    if(!root)return
    let raf=0,alive=true
    const observed=new Set()
    const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule)
    function schedule(){if(alive&&!raf)raf=requestAnimationFrame(measure)}
    function measure(){
      raf=0
      const sections=[...root.querySelectorAll(':scope > section[id^="pt-"]')]
      const targets=new Set([root,...sections,...root.querySelectorAll(FRAMES)])
      for(const node of observed)if(!targets.has(node)){resize?.unobserve(node);observed.delete(node)}
      for(const node of targets)if(!observed.has(node)){resize?.observe(node);observed.add(node)}
      for(const section of sections){
        const boundary=section.getBoundingClientRect().bottom
        let bottom=boundary
        for(const frame of section.querySelectorAll(FRAMES)){
          if(!frame.getClientRects().length||frame.classList.contains('is-hidden'))continue
          const rect=frame.getBoundingClientRect()
          const scale=frame.offsetHeight?rect.height/frame.offsetHeight:1
          const textOverflow=Math.max(0,frame.scrollHeight-frame.clientHeight)*scale
          bottom=Math.max(bottom,rect.bottom+textOverflow)
        }
        const space=bottom>boundary+1?Math.ceil(bottom-boundary)+24:0
        if(space){
          const value=space+'px'
          if(section.style.getPropertyValue('--pt-content-overflow-space')!==value)
            section.style.setProperty('--pt-content-overflow-space',value)
          section.dataset.ptContentOverflow='true'
        }else{
          section.style.removeProperty('--pt-content-overflow-space')
          delete section.dataset.ptContentOverflow
        }
      }
    }
    const mutations=new MutationObserver(records=>{
      if(records.some(record=>record.type!=='attributes'||
        record.target===root||record.target.matches?.(FRAMES)))schedule()
    })
    mutations.observe(root,{subtree:true,childList:true,characterData:true,
      attributes:true,attributeFilter:['style','class','hidden']})
    root.addEventListener('load',schedule,true)
    window.addEventListener('resize',schedule)
    document.fonts?.addEventListener('loadingdone',schedule)
    document.fonts?.ready.then(schedule)
    measure()
    return ()=>{
      alive=false;cancelAnimationFrame(raf);resize?.disconnect();mutations.disconnect()
      root.removeEventListener('load',schedule,true)
      window.removeEventListener('resize',schedule)
      document.fonts?.removeEventListener('loadingdone',schedule)
      for(const section of root.querySelectorAll('[data-pt-content-overflow]')){
        section.style.removeProperty('--pt-content-overflow-space')
        delete section.dataset.ptContentOverflow
      }
    }
  },[rootRef])
}
