/**
 * Scroll-scrubbed typography. All progress values derive from the element's
 * real bounding rectangle and viewport, not from elapsed animation time.
 * This works for the published page and the internally scrolling Admin preview.
 */
export function clamp01(value){
  const n=Number(value)
  return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0
}
export function scrollRevealProgress(elementTop,viewportTop,viewportBottom){
  const top=Number(viewportTop),bottom=Number(viewportBottom)
  if(!Number.isFinite(top)||!Number.isFinite(bottom)||bottom<=top)return 1
  const range=bottom-top
  const starts=top+range*.90
  const finished=top+range*.30
  return clamp01((starts-elementTop)/Math.max(1,starts-finished))
}
export function scrollTextPose(progress,kind='body'){
  const p=clamp01(progress)
  const weight=kind==='title'?1:kind==='eyebrow'?.68:.85
  const unseen=1-p
  return {
    alpha:Number(Math.pow(p,.82).toFixed(4)),
    rise:(unseen*38*weight).toFixed(2)+'px',
    tilt:(unseen*-13*weight).toFixed(2)+'deg',
    depth:(unseen*-48*weight).toFixed(2)+'px',
    clip:(unseen*76).toFixed(2)+'%',
    glow:Number((Math.sin(p*Math.PI)*.46).toFixed(4))
  }
}
export function scrollCanvasBounds(rootRect,hostRect,windowHeight){
  const win=Math.max(1,Number(windowHeight)||1)
  const top=Math.max(0,hostRect?hostRect.top:0,rootRect.top)
  const bottom=Math.min(win,hostRect?hostRect.bottom:win,rootRect.bottom)
  const visible=Math.max(0,bottom-top)
  return {top,bottom,height:visible,localY:Math.max(0,top-rootRect.top)}
}
