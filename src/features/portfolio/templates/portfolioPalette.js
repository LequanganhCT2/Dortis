/** Artist-selectable palettes. Old publications keep the red-gold colorway. */
export const FORM_COLOR_PALETTES=Object.freeze([
 {id:'red-gold',label:'Đỏ – vàng',swatches:['#740714','#efbd64']},
 {id:'red-white',label:'Đỏ – trắng',swatches:['#9e1025','#fffafa']},
 {id:'yellow-white',label:'Vàng – trắng',swatches:['#d2a12a','#fffef4']},
 {id:'black-white',label:'Đen – trắng',swatches:['#101114','#f8f8f8']}
])
export const SILK_FLOW_COLOR_PALETTES=Object.freeze([
 {id:'ice-blue',label:'Xanh băng – trắng',swatches:['#84c5e9','#fcfeff']},
 {id:'seafoam-white',label:'Xanh ngọc – trắng',swatches:['#73c9c8','#faffff']},
 {id:'silver-white',label:'Bạc – trắng',swatches:['#b5c9da','#ffffff']},
 {id:'navy-white',label:'Xanh đậm – trắng',swatches:['#345c89','#eef6ff']}
])
export function paletteOptionsForTheme(theme){
 return theme==='silk-flow'?SILK_FLOW_COLOR_PALETTES:FORM_COLOR_PALETTES
}
export function normalizePortfolioPalette(value){
 return [...FORM_COLOR_PALETTES,...SILK_FLOW_COLOR_PALETTES].some(p=>p.id===value)?value:'red-gold'
}
const RAMPS={
 'red-white':['#430009','#ad1124','#e3484c','#ffe2e2','#ffffff'],
 'yellow-white':['#563804','#bd840f','#efbb41','#fff1bd','#ffffff'],
 'black-white':['#060608','#292a2e','#85868b','#e2e3e5','#ffffff']
}
function mix(a,b,t){
 const aa=parseInt(a.slice(1),16),bb=parseInt(b.slice(1),16)
 return '#'+[16,8,0].map(shift=>{
  const x=(aa>>shift)&255,y=(bb>>shift)&255
  return Math.round(x+(y-x)*t).toString(16).padStart(2,'0')
 }).join('')
}
/** Retint SVG satin colors without modifying silk geometry or alpha. */
export function tintSilkColor(hex,palette='red-gold'){
 const ramp=RAMPS[palette]
 if(!ramp||!/^#[a-f0-9]{6}$/i.test(hex))return hex
 const n=parseInt(hex.slice(1),16)
 const l=Math.max(0,Math.min(1,(((n>>16)&255)*.299+((n>>8)&255)*.587+(n&255)*.114)/255))
 const i=Math.min(3,Math.floor(l*4))
 return mix(ramp[i],ramp[i+1],l*4-i)
}
