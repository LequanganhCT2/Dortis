/**
 * Font size and text-frame width are independent.
 *
 * Text handles resize their containing block as a percentage of its parent,
 * allowing natural line wrapping without changing font-size or CSS scale.
 * Image handles intentionally keep their existing scale behavior.
 */
export function isTextFrame(id){
  return id==='eyebrow'||id==='title'||id==='body'||String(id).startsWith('note:')
}
export function clampTextWidth(value){
  const n=Number(value)
  return Number.isFinite(n)?Math.round(Math.max(14,Math.min(100,n))*10)/10:100
}
export function storedTextWidth(position){
  const n=position?.widthPct
  return n===null||n===undefined||n===''?null:clampTextWidth(n)
}
export function measuredTextWidth(elementWidth,parentWidth){
  if(!(parentWidth>0))return 100
  return clampTextWidth(elementWidth/parentWidth*100)
}
export function resizeTextWidth(startWidth,deltaPixels,parentWidth){
  if(!(parentWidth>0))return clampTextWidth(startWidth)
  return clampTextWidth(startWidth+deltaPixels/parentWidth*100)
}
export function textBoxWidthStyle(position){
  const width=storedTextWidth(position)
  return width===null?{}:{width:width+'%'}
}
