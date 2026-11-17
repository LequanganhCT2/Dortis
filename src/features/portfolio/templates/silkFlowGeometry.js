import {normalizeFabricChoice} from './silkFabricGeometry.js'

/** Lightweight, continuous chiffon surfaces in a full-document SVG. No image assets. */
export const FLOW_SHEETS=Object.freeze([
  {id:'main',phase:0.28,offset:-75,width:335,swing:295,opacity:.88},
  {id:'floating',phase:2.62,offset:100,width:265,swing:355,opacity:.68},
  {id:'back',phase:4.94,offset:-20,width:400,swing:240,opacity:.48}
])
const safe=(n,min,max)=>Math.max(min,Math.min(max,n))

export function chiffonPoint(sheet,y,across,layout='diagonal',direction='down-right'){
  const choice=normalizeFabricChoice(layout,direction)
  const phase=sheet.phase
  const progress=y/580
  const flip=choice.direction.includes('left')||choice.direction==='to-left'||
    choice.direction==='left'||choice.direction==='outward'?-1:1
  const envelope=Math.sin(y/470+phase)*sheet.swing+
    Math.sin(y/176+phase*.53)*68
  let center=500+sheet.offset+envelope*flip
  if(choice.layout==='horizontal')center+=Math.cos(y/710+phase)*110
  if(choice.layout==='vertical')center=500+sheet.offset+envelope*.6
  if(choice.layout==='curtain')center=500+(sheet.phase>3?1:-1)*(210+Math.sin(progress+phase)*95)
  const breadth=sheet.width*(.87+.19*Math.sin(y/300+phase)+
    .07*Math.sin(y/83+phase*2))
  const crease=Math.sin(y/112+phase+across*5.6)*34+
    Math.sin(y/310+phase*1.7)*39
  const twist=across*78*Math.sin(y/360+phase)
  return [center+across*breadth*2, y+crease+twist]
}
const trace=points=>{
  if(!points.length)return ''
  return 'M '+points.map((p,i)=>(i?'L ':'')+
    p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ')
}
function between(ys,sheet,from,to,layout,direction){
  const left=ys.map(y=>chiffonPoint(sheet,y,from,layout,direction))
  const right=ys.map(y=>chiffonPoint(sheet,y,to,layout,direction)).reverse()
  return trace(left)+' '+trace(right).replace(/^M /,'L ')+' Z'
}
export function buildChiffonSheets(sheet,height,layout='diagonal',direction='down-right'){
  const h=safe(Number(height)||6400,900,28000)
  const samples=Math.ceil((h+360)/36)
  const ys=Array.from({length:samples+1},(_,i)=>-180+i*(h+360)/samples)
  const line=across=>trace(ys.map(y=>chiffonPoint(sheet,y,across,layout,direction)))
  return {
    surface:between(ys,sheet,-.5,.5,layout,direction),
    underside:between(ys,sheet,-.49,-.22,layout,direction),
    luminous:between(ys,sheet,-.16,.07,layout,direction),
    fold:between(ys,sheet,.19,.32,layout,direction),
    nearEdge:line(-.48),farEdge:line(.48),
    threads:[-.38,-.29,-.11,.04,.14,.26,.41].map(line)
  }
}
