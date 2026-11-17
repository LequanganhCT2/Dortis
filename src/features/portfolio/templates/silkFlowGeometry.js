import {normalizeFabricChoice} from './silkFabricGeometry.js'

/**
 * Wide, airborne chiffon — horizontal billows with deep central troughs,
 * high lifted peaks, folded translucent hems and closely spaced weave lines.
 * Everything is generated from curves, so no stock/watermarked image is used.
 * A single SVG spans the full document instead of restarting at each section.
 */
export const FLOW_SHEETS=Object.freeze([
  {id:'upper',phase:0.15,offset:-88,width:310,opacity:.53},
  {id:'body',phase:1.25,offset:18,width:410,opacity:.84},
  {id:'lower',phase:2.8,offset:148,width:290,opacity:.42}
])

const clamp=(n,min,max)=>Math.min(max,Math.max(min,n))
const gaussian=(t,center,spread)=>Math.exp(-Math.pow((t-center)/spread,2))
const path=points=>'M '+points.map((p,i)=>(i?'L ':'')+
  p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ')
const polygon=(upper,lower)=>path(upper)+' '+path([...lower].reverse()).replace(/^M /,'L ')+' Z'

/** Horizontal parameterization: x travels left-to-right across a cloth span. */
export function chiffonPoint(sheet,x,across,sceneIndex=0,layout='diagonal',direction='down-right'){
  const choice=normalizeFabricChoice(layout,direction)
  const t=(x+150)/1300
  const phase=sheet.phase+sceneIndex*.63
  const reverse=/left/.test(choice.direction)
  const q=reverse?1-t:t
  const riseLeft=-150*gaussian(q,.07,.17)
  const trough=222*gaussian(q,.47,.26)
  const highRight=-238*gaussian(q,.77,.17)
  const finish=80*gaussian(q,1.02,.14)
  const billow=34*Math.sin(2*Math.PI*(q*.85)+phase)+
    24*Math.sin(4*Math.PI*q+phase*.4)
  const layoutShear=choice.layout==='vertical'?145:
    choice.layout==='curtain'?-85:choice.layout==='diagonal'?70:0
  const yCenter=440+sheet.offset+riseLeft+trough+highRight+finish+
    billow+(q-.5)*layoutShear+sceneIndex*930
  // Breathable cloth: widen near the middle, thin and flutter at both ends.
  const breadth=sheet.width*(.64+.32*Math.sin(Math.PI*clamp(t,0,1))+
    .1*Math.sin(5*Math.PI*t+phase))
  const pleat=20*Math.sin(t*19+across*5.8+phase)*
    (Math.sin(Math.PI*clamp(t,0,1))+.12)
  const fold=across*57*Math.sin(2*Math.PI*t+phase*.8)
  const drift=across*50*Math.cos(3*Math.PI*t+phase)
  return [x+drift, yCenter+across*breadth+pleat+fold]
}

function makePass(sheet,sceneIndex,layout,direction){
  const samples=52
  const xs=Array.from({length:samples+1},(_,i)=>-150+i*1300/samples)
  const line=across=>path(xs.map(x=>chiffonPoint(sheet,x,across,sceneIndex,layout,direction)))
  const band=(a,b)=>{
    const upper=xs.map(x=>chiffonPoint(sheet,x,a,sceneIndex,layout,direction))
    const lower=xs.map(x=>chiffonPoint(sheet,x,b,sceneIndex,layout,direction))
    return polygon(upper,lower)
  }
  const threads=Array.from({length:21},(_,i)=>line(-.45+i*.045))
  return {
    surface:band(-.5,.5),
    underside:band(-.49,-.19),
    luminous:band(-.17,.06),
    fold:band(.2,.33),
    gauze:band(.34,.49),
    nearEdge:line(-.49),
    farEdge:line(.49),
    threads
  }
}

export function buildChiffonSheets(sheet,height,layout='diagonal',direction='down-right'){
  const h=clamp(Number(height)||6400,900,28000)
  // Neighboring full-width billows overlap vertically, never aligned to section boundaries.
  const passCount=Math.ceil(h/930)+1
  const passes=Array.from({length:passCount},(_,index)=>
    makePass(sheet,index,layout,direction))
  return {passes,...passes[0]}
}
