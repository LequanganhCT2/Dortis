/**
 * Single document-height satin fabric, not an extrusion/tube following a line.
 * Long cross-screen traversals have soft asymmetric edges, changing thickness,
 * creases, and independently drifting folds.
 */
const W=1000
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v))
export const FABRIC_BRANCHES=Object.freeze([
  {id:'left-velvet',phase:-1.58,width:245,rhythm:1.05,offset:0,shade:'ruby'},
  {id:'right-satin',phase:1.67,width:260,rhythm:.84,offset:0,shade:'scarlet'},
  {id:'gold-veil',phase:3.16,width:130,rhythm:1.24,offset:0,shade:'champagne'}
])
export function normalizeFabricChoice(layout,direction){
  const choices={
    vertical:['right','left'],
    diagonal:['down-right','down-left','up-right','up-left'],
    horizontal:['to-right','to-left'],
    curtain:['inward','outward']
  }
  const picked=Object.hasOwn(choices,layout)?layout:'diagonal'
  return {layout:picked,direction:choices[picked].includes(direction)?
    direction:choices[picked][0]}
}
export function fabricCenter(branch,y,layout='diagonal',direction='down-right'){
  const config=normalizeFabricChoice(layout,direction)
  const speed=config.layout==='horizontal'?.0022:
    config.layout==='vertical'?.00118:
    config.layout==='curtain'?.0015:.0017
  const mirror=['left','down-left','up-left','to-left','outward'].includes(config.direction)
  const upwards=['up-right','up-left'].includes(config.direction)
  const phase=branch.phase+(upwards?Math.PI:0)
  const wave=y*speed*branch.rhythm+phase
  const sway=515*Math.sin(wave)+72*Math.sin(wave*1.77+branch.phase*.7)
  const slope=515*speed*branch.rhythm*Math.cos(wave)+
    72*1.77*speed*branch.rhythm*Math.cos(wave*1.77+branch.phase*.7)
  let x=W/2+sway,dx=slope
  if(config.layout==='curtain'){
    const side=branch.id==='right-satin'?1:-1
    x=W/2+side*(260+215*Math.sin(wave))
    dx=side*215*speed*branch.rhythm*Math.cos(wave)
  }
  if(mirror){x=W-x;dx=-dx}
  return {x,dx}
}
function sample(branch,y,side,layout,direction){
  const p=fabricCenter(branch,y,layout,direction)
  const n=Math.hypot(1,p.dx)
  const width=branch.width*(1+.25*Math.sin(y/320+branch.phase)+
    .10*Math.sin(y/99+branch.phase*1.7))
  const ripple=21*Math.sin(y/124+branch.phase*2+side*4.9)*
    (Math.abs(side)+.35)
  const offset=side*width/2+ripple
  return [
    p.x+offset/n,
    y-p.dx*offset/n+9*Math.sin(y/103+branch.phase+side*5)
  ]
}
function round(v){return (Math.round(v*10)/10).toString()}
function commands(points,move='M'){
  if(!points.length)return ''
  return points.map(([x,y],i)=>(i===0?move:'L')+round(x)+' '+round(y)).join(' ')
}
export function fabricBand(branch,height,layout,direction,from=-1,to=1){
  const h=clamp(Math.ceil(Number(height)||3200),600,32000)
  const total=Math.ceil(h/34)
  const ys=Array.from({length:total+1},(_,i)=>i*h/total)
  const forward=ys.map(y=>sample(branch,y,from,layout,direction))
  const back=ys.reverse().map(y=>sample(branch,y,to,layout,direction))
  return commands(forward)+' '+commands(back,'L')+' Z'
}
export function fabricEdge(branch,height,layout,direction,side=-1){
  const h=clamp(Math.ceil(Number(height)||3200),600,32000)
  const total=Math.ceil(h/29)
  const points=Array.from({length:total+1},(_,i)=>
    sample(branch,i*h/total,side,layout,direction))
  return commands(points)
}
export function buildFabricBands(branch,height,layout='diagonal',direction='down-right'){
  return {
    full:fabricBand(branch,height,layout,direction,-1,1),
    underfold:fabricBand(branch,height,layout,direction,-1,-.53),
    shadow:fabricBand(branch,height,layout,direction,.38,1),
    satin:fabricBand(branch,height,layout,direction,-.41,-.05),
    high:fabricBand(branch,height,layout,direction,-.16,-.095),
    fringe:fabricEdge(branch,height,layout,direction,.99)
  }
}
export function scatterGlitter(height,count=115){
  const h=clamp(height||3200,600,32000)
  return Array.from({length:count},(_,i)=>{
    // Bright concentration near the opening central halo; a gentle,
    // non-repeating constellation continues through the whole document.
    const seed=n=>{const v=Math.sin(n*13.771+7.43)*43758.5453;return v-Math.floor(v)}
    const top=i<44
    return {
      id:i,x:90+seed(i*3+1)*830,
      y:top?30+seed(i*2+9)*780:seed(i*3+4)*h,
      r:top?(i%6===0?3.3:1.2+seed(i)*2):(i%9===0?2.3:.65+seed(i*5)*1.6),
      dur:5+(i%7)*1.9,delay:-(i%13)*.43,
      glow:i%9===0
    }
  })
}
