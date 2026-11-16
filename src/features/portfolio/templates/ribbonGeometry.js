/**
 * Continuous portfolio ribbon geometry.
 *
 * One ribbon lives in document coordinates, not section coordinates. Its
 * broad, nearly straight diagonal traversals cross the entire viewport before
 * folding *outside* the canvas. No section restart or repeated SVG tile.
 * Each branch has an independent phase, width, color and animation duration.
 */
export const RIBBON_SCENE_WIDTH=1000
export const RIBBON_BRANCHES=Object.freeze([
  {id:'crimson',width:116,phase:0.32,offset:.05,run:1.02,
    colors:['#43030d','#8b0a19','#d1282c','#ff8871','#ffe1ad','#ed6e52','#8a0d1f','#41030c']},
  {id:'gold',width:82,phase:1.74,offset:.38,run:.89,
    colors:['#4a240e','#9f581e','#edba55','#fff0b4','#fffbe0','#edc46e','#9d541d','#51240c']},
  {id:'rose',width:101,phase:3.12,offset:.73,run:1.19,
    colors:['#3a0611','#821029','#d24358','#ffc1a8','#fff2d5','#e47a85','#8d1631','#440516']},
  {id:'bronze',width:56,phase:4.61,offset:1.17,run:.98,
    colors:['#3d1411','#8c391c','#db7b41','#ffe7a1','#fff8d5','#d79c57','#85401e','#3d1510']}
])
export const RIBBON_LAYOUTS=['vertical','diagonal','horizontal','curtain']
const VALID_DIRECTIONS={
  vertical:['right','left'],diagonal:['down-right','down-left','up-right','up-left'],
  horizontal:['to-right','to-left'],curtain:['inward','outward']
}
export function normalizeRibbonGeometryChoice(layout,direction){
  const variant=RIBBON_LAYOUTS.includes(layout)?layout:'vertical'
  const options=VALID_DIRECTIONS[variant]
  return {layout:variant,direction:options.includes(direction)?direction:options[0]}
}
// Smooth the reversal only at both *offscreen* edges: the central 76% of every
// traversal remains a strong near-straight diagonal slash.
function diagonalProgress(local){
  const edge=.12,velocity=1/(1-edge)
  if(local<edge)return [velocity*local*local/(2*edge),velocity*local/edge]
  if(local>1-edge){
    const end=1-local
    return [1-velocity*end*end/(2*edge),velocity*end/edge]
  }
  return [velocity*(local-edge/2),velocity]
}
export function ribbonGeometryAt(branch,y,layout='vertical',direction='right'){
  const choice=normalizeRibbonGeometryChoice(layout,direction)
  const baseRun=choice.layout==='horizontal'?0.53:
    choice.layout==='diagonal'?0.74:choice.layout==='curtain'?0.99:1.03
  const span=RIBBON_SCENE_WIDTH*branch.run*baseRun
  const t=y/span+branch.offset
  const leg=Math.floor(t),local=t-leg
  const [ease,derivative]=diagonalProgress(local)
  const reverse=/^(left|down-left|up-left|to-left)$/.test(choice.direction)
  const reverseVertical=/^(up-right|up-left|outward)$/.test(choice.direction)
  const parity=(leg+(reverseVertical?1:0))%2===0
  let low=-415,high=1415
  if(choice.layout==='curtain'){
    const leftSide=branch.id==='crimson'||branch.id==='rose'
    // Two distinct families cross their own half then touch toward the
    // center, like theatrical curtains rather than four parallel columns.
    low=leftSide?-420:500
    high=leftSide?625:1420
  }
  const from=parity?low:high
  const to=parity?high:low
  const tinyFold=14*Math.sin(y/275+branch.phase)
  let x=from+(to-from)*ease+tinyFold
  let slope=(to-from)*derivative/span+14*Math.cos(y/275+branch.phase)/275
  if(reverse){x=RIBBON_SCENE_WIDTH-x;slope=-slope}
  const fold=(1+.075*Math.sin(y/310+branch.phase))*
    (1+.036*Math.sin(y/110-branch.phase))
  return {x,slope,fold}
}
export function ribbonCrossesWholeViewport(branch,layout='vertical',direction='right',height=6400){
  const readings=Array.from({length:400},(_,i)=>ribbonGeometryAt(branch,i*height/399,layout,direction).x)
  return {min:Math.min(...readings),max:Math.max(...readings)}
}
