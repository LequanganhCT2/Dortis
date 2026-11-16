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
