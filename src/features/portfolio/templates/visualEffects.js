/** Deterministic design compositions, shared by every Portfolio template.
 * Auto mode varies by section instead of copying one scene throughout the page.
 * The selected effect only controls presentation, never the artist's text.
 */
const effects=['depth','overlap','spotlight','glass','orbit','typography']
export function chooseSectionEffect({effect='auto',layout='split',index=0,style='editorial',imageCount=0}={}){
  if(effects.includes(effect)){
    if(imageCount===0&&effect!=='typography')return 'typography'
    // Spotlight is reserved for a single hero photo. When more photos arrive
    // switch automatically to a visible 3D gallery instead of hiding photos.
    if(effect==='spotlight'&&imageCount>1)return 'orbit'
    return effect
  }
  if(!imageCount)return 'typography'
  if(layout==='cover')return imageCount>1?'orbit':'spotlight'
  if(layout==='mosaic')return index%2?'orbit':'depth'
  if(layout==='grid'&&imageCount>=3)return index%3===0?'glass':'orbit'
  if(layout==='text')return 'typography'
  if(index===0)return style==='cinematic'?'spotlight':style==='editorial'?'overlap':'depth'
  if(layout==='split-reverse')return 'glass'
  return ['depth','overlap','glass','typography'][index%4]
}
export function sectionHasRealImage(section,urls={}){
  return (section.images||[]).some(asset=>Boolean(asset?.path&&urls[asset.path]))
}
