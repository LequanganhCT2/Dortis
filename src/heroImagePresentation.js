/** Safe display settings shared by the public Hero and its real Admin preview. */
export const HERO_RATIOS=['4/3','16/9','3/2','1/1','3/4','9/16']
export const HERO_ZOOM_MIN=50
export const HERO_ZOOM_MAX=250
export const HERO_CARD_SIZE_MIN=40
export const HERO_CARD_SIZE_MAX=100
export const HERO_SPACING_MIN=50
export const HERO_SPACING_MAX=160
export function heroStageRatio(content={}){
  const ratio=content.heroStageAspectRatio
  return HERO_RATIOS.includes(ratio)?ratio:'4/3'
}
export function heroCardSpacing(content={}){
  const value=Number(content.heroCardSpacing??100)
  return Number.isFinite(value)?
    Math.min(HERO_SPACING_MAX,Math.max(HERO_SPACING_MIN,Math.round(value))):100
}
export function heroCardSize(content={},cardId=1){
  const value=Number(content['card'+cardId+'HomeSize']??100)
  return Number.isFinite(value)
    ?Math.min(HERO_CARD_SIZE_MAX,Math.max(HERO_CARD_SIZE_MIN,Math.round(value)))
    :100
}
export function heroAspectRatio(content={},cardId=1){
  const ratio=content['card'+cardId+'AspectRatio']
  return HERO_RATIOS.includes(ratio)?ratio:'4/3'
}
export function heroWidthFactor(ratio='4/3'){
  const [w,h]=String(ratio).split('/').map(Number)
  return Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0?Math.min(1,(w/h)/(4/3)):1
}
export function heroZoom(content={},cardId=1,imageNumber=1){
  const value=Number(content['card'+cardId+'Image'+imageNumber+'Zoom']??100)
  return Number.isFinite(value)?Math.min(HERO_ZOOM_MAX,Math.max(HERO_ZOOM_MIN,value)):100
}
