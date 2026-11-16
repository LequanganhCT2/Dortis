/** Shared safe media grid decisions. A photo always occupies one CSS Grid cell. */
export function ribbonGridColumns(layout,count){
  const n=Math.min(10,Math.max(0,Math.floor(Number(count)||0)))
  if(n<=1)return 1
  if(['grid','mosaic','wide'].includes(layout))return Math.min(3,n)
  return Math.min(2,n)
}
export function ribbonVariant(section={},index=0){
  if(index===0||section.layout==='cover')return 'hero'
  if(['grid','mosaic','wide'].includes(section.layout))return 'gallery'
  return 'standard'
}
