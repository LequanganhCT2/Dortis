/** Discrete section reveal, independent from scroll distance within a block. */
export function classifyPortfolioBlock(rect,viewportTop,viewportBottom){
  const height=Math.max(0,viewportBottom-viewportTop)
  if(height<=0)return 'visible'
  const top=viewportTop+Math.min(76,height*.12)
  const bottom=viewportBottom-Math.min(100,height*.16)
  if(rect.bottom<=top)return 'hidden-top'
  if(rect.top>=bottom)return 'hidden-bottom'
  return 'visible'
}
export function blockTravelDirection(previousPosition,nextPosition,fallback='down'){
  const difference=nextPosition-previousPosition
  if(difference>1)return 'down'
  if(difference< -1)return 'up'
  return fallback
}
export function blockAnimationName(state,direction){
  if(state==='visible')return direction==='up'?'pt-block-enter-top':'pt-block-enter-bottom'
  return state==='hidden-top'?'pt-block-exit-top':'pt-block-exit-bottom'
}

/** One section entrance schedules its label, title, copy, then real photos.
 * Durations use milliseconds, not scroll percentage. */
export function portfolioPartDelays(kind,index=0){
  const order=Math.max(0,Math.min(8,Math.trunc(Number(index)||0)))
  switch(kind){
    case 'eyebrow': return {enter:40,exit:235}
    case 'title': return {enter:160,exit:165}
    case 'body': return {enter:350+order*95,exit:95}
    case 'image': return {enter:550+order*115,exit:order*35}
    default: return {enter:0,exit:0}
  }
}
