/**
 * Decide how a portfolio asset should be presented. Cut-out portraits must
 * not inherit a photo-card background, rectangular borders or shadows.
 *
 * Existing cut-out PNGs were historically uploaded without a metadata flag.
 * Treat those PNG paths as frameless by default, while allowing an explicit
 * false override for an opaque PNG that should retain its picture frame.
 */
export function isCutoutArtwork(asset){
  if(!asset?.path)return false
  if(asset.cutout===true)return true
  if(asset.cutout===false)return false
  return /\.png(?:$|[?#])/i.test(asset.path)
}


/**
 * Artistic background applied behind a transparent cutout. The base image
 * retains its alpha and the shadow follows its subject, not its rectangle.
 * Existing PNGs automatically receive the Aura design until an Admin opts out.
 */
export const CUTOUT_STAGE_STYLES=Object.freeze([
  {id:'aura',label:'Aura ánh kim · nền sáng mềm'},
  {id:'glass',label:'Khung kính mờ · viền vàng nhẹ'},
  {id:'bare',label:'Trong suốt hoàn toàn'}
])
export function cutoutStageStyle(asset){
  if(!isCutoutArtwork(asset))return null
  return CUTOUT_STAGE_STYLES.some(style=>style.id===asset?.cutoutStyle)?
    asset.cutoutStyle:'aura'
}
