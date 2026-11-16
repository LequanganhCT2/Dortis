/**
 * Quick composition for one selected text layer. Artist/section/device-local;
 * never change font size, scale or source text.
 */
export const TEXT_QUICK_LAYOUTS=Object.freeze([
  {id:'left',label:'Trái',symbol:'⇤'},
  {id:'center',label:'Giữa',symbol:'↔'},
  {id:'right',label:'Phải',symbol:'⇥'},
  {id:'diagonal-left',label:'Chéo trái',symbol:'⤢'},
  {id:'diagonal-right',label:'Chéo phải',symbol:'⤡'}
])
const OPTIONS=new Set(TEXT_QUICK_LAYOUTS.map(item=>item.id))
export function normalizeTextQuickLayout(choice){
  return OPTIONS.has(choice)?choice:'left'
}
export function quickTextPreset(choice){
  const value=normalizeTextQuickLayout(choice)
  const right=value==='right'||value==='diagonal-right'
  const center=value==='center'
  return {
    align:center?'center':right?'right':'left',
    rotation:value==='diagonal-left'?-8:value==='diagonal-right'?8:0
  }
}
export function quickSceneTextPlacement(choice,layer={},device='desktop'){
  const {align,rotation}=quickTextPreset(choice)
  const width=Math.min(100,Math.max(8,Number(layer.w)|| (device==='mobile'?84:46)))
  const margin=device==='mobile'?4:6
  const x=align==='center'?(100-width)/2:
    align==='right'?100-width-margin:margin
  return {x:Math.round(Math.max(0,x)*10)/10,align,rotation}
}
export function quickRibbonTextPlacement(choice,previous={}){
  const {align,rotation}=quickTextPreset(choice)
  // The ribbon Form lays text out in its safe copy column; retain its
  // document flow, make the frame nearly full-width, and reposition in-column.
  return {
    position:{...previous,x:0,y:0,widthPct:92,rotation},
    typography:{align}
  }
}
