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
/**
 * Both viewport edges have their own fade/translation channels.
 *
 * Scrolling down: bottom enter (+Y) -> visible -> top exit (-Y).
 * Scrolling up:   top enter (-Y)    -> visible -> bottom exit (+Y).
 *
 * This is derived only from the DOM position. No sticky direction flag is
 * needed, so wheel reversals in the middle of an animation never jump.
 */
export function scrollEdgeOffsets(envelope={enter:1,exit:1}){
  const bottom=1-clamp01(envelope.enter)
  const top=1-clamp01(envelope.exit)
  return {bottom,top,travel:bottom-top}
}
export function scrollTextPose(progress,kind='body',envelope={enter:progress,exit:1}){
  const p=clamp01(progress)
  const weight=kind==='title'?1:kind==='eyebrow'?.68:.85
  const {bottom,top,travel}=scrollEdgeOffsets(envelope)
  return {
    alpha:Number(Math.pow(p,.82).toFixed(4)),
    rise:(travel*38*weight).toFixed(2)+'px',
    tilt:(travel*-13*weight).toFixed(2)+'deg',
    depth:((bottom+top)*-48*weight).toFixed(2)+'px',
    clip:(Math.max(bottom,top)*76).toFixed(2)+'%',
    clipTop:(top*76).toFixed(2)+'%',
    clipBottom:(bottom*76).toFixed(2)+'%',
    glow:Number((Math.sin(p*Math.PI)*.46).toFixed(4))
  }
}

/**
 * Bidirectional fade envelope: enter from the bottom, bloom in the reading
 * zone, and fade out when the item leaves the top of the scroll viewport.
 * Order delays images within the same section without timers.
 */
export function scrollRevealEnvelope(elementTop,elementBottom,viewportTop,viewportBottom,kind='body',order=0){
  const top=Number(viewportTop),bottom=Number(viewportBottom)
  if(!Number.isFinite(top)||!Number.isFinite(bottom)||bottom<=top){
    return {progress:1,enter:1,exit:1}
  }
  const height=bottom-top
  const stagger=Math.min(4,Math.max(0,Number(order)||0))*.055
  const enterStart=top+height*(.94-stagger)
  const enterEnd=top+height*(.56-stagger*.48)
  const enter=clamp01((enterStart-Number(elementTop))/Math.max(1,enterStart-enterEnd))
  const exitStart=top+height*(kind==='image'?.32:.27)
  const exitEnd=top+height*.045
  const exit=clamp01((Number(elementBottom)-exitEnd)/Math.max(1,exitStart-exitEnd))
  return {progress:Number((enter*exit).toFixed(4)),enter,exit}
}
export function scrollImagePose(progress,envelope={enter:progress,exit:1}){
  const p=clamp01(progress)
  const {bottom,top,travel}=scrollEdgeOffsets(envelope)
  const eased=1-Math.pow(1-p,3)
  const bloom=Math.sin(Math.PI*p)
  // The top edge is the reverse of bottom entrance: the photo comes in from
  // above, slightly enlarged, rather than shrinking upward from below.
  const base=top>bottom?1+.12*top:.86+.14*eased
  return {
    alpha:Number(Math.pow(p,.86).toFixed(4)),
    scale:(base+.035*bloom*bloom).toFixed(4),
    rise:(travel*66).toFixed(2)+'px',
    tilt:(travel*-9).toFixed(2)+'deg',
    blur:((1-p)*4.2).toFixed(2)+'px',
    glow:Number((bloom*.36).toFixed(4))
  }
}

export function scrollCanvasBounds(rootRect,hostRect,windowHeight){
  const win=Math.max(1,Number(windowHeight)||1)
  const top=Math.max(0,hostRect?hostRect.top:0,rootRect.top)
  const bottom=Math.min(win,hostRect?hostRect.bottom:win,rootRect.bottom)
  const visible=Math.max(0,bottom-top)
  return {top,bottom,height:visible,localY:Math.max(0,top-rootRect.top)}
}
