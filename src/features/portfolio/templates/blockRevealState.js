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

/** Individual elements show as soon as they cross the viewport edge. */
export function classifyPortfolioPart(rect,viewportTop,viewportBottom){
  const height=Math.max(0,viewportBottom-viewportTop)
  if(height<=0)return 'visible'
  const top=viewportTop+Math.min(26,height*.035)
  const bottom=viewportBottom-Math.min(30,height*.04)
  if(rect.bottom<=top)return 'hidden-top'
  if(rect.top>=bottom)return 'hidden-bottom'
  return 'visible'
}
/** No multi-second section queues. A very short image stagger is optional,
 * and only matters if photos enter the viewport in the same frame.
 */
export function portfolioPartDelays(kind,index=0){
  const order=Math.max(0,Math.min(8,Math.trunc(Number(index)||0)))
  switch(kind){
    case 'eyebrow':return {enter:0,exit:0}
    case 'title':return {enter:0,exit:0}
    case 'body':return {enter:0,exit:0}
    case 'image':return {enter:Math.min(70,order*12),exit:0}
    default:return {enter:0,exit:0}
  }
}

/** Speed multiplier: smaller values mean a more deliberate animation. */
export const PORTFOLIO_REVEAL_SPEEDS=Object.freeze([
  {value:.2,label:'Siêu chậm · 0,2×'},
  {value:.3,label:'Rất chậm · 0,3×'},
  {value:.4,label:'Chậm sâu · 0,4×'},
  {value:.5,label:'Chậm nhẹ · 0,5×'},
  {value:.6,label:'Chậm · 0,6×'},
  {value:.8,label:'Chậm vừa · 0,8×'},
  {value:1,label:'Bình thường · 1×'},
  {value:1.25,label:'Nhanh · 1,25×'},
  {value:1.5,label:'Rất nhanh · 1,5×'}
])
export function normalizeRevealSpeed(value){
  const parsed=Number(value)
  return PORTFOLIO_REVEAL_SPEEDS.some(item=>item.value===parsed)?parsed:.8
}
export function scaledRevealMs(ms,speed=.8){
  return Math.max(1,Math.round(Math.max(0,Number(ms)||0)/normalizeRevealSpeed(speed)))
}
