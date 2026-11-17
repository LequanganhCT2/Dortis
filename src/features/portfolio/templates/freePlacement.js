/**
 * Permit authored text/image layers to travel across the full portfolio stage,
 * including past the bounds of their original grid slot. Numeric bounds only
 * protect against invalid runaway coordinates; they are not layout snapping.
 */
export const SCENE_MOVE_LIMIT=300
export const OFFSET_MOVE_LIMIT=5000
export function boundedPlacement(value,min,max,fallback=0){
  const n=Number(value)
  return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback
}
export function hasOverflowPlacement(positions,threshold=95){
  return Object.values(positions||{}).some(value=>
    value&&typeof value==='object'&&(
      Math.abs(Number(value.x)||0)>threshold||
      Math.abs(Number(value.y)||0)>threshold
    ))
}
export function hasSceneOverflowPlacement(scene){
  return Object.values(scene?.layers||{}).some(layer=>
    layer&&(layer.x<0||layer.y<0||layer.x+layer.w>100||layer.y+layer.h>100))
}
