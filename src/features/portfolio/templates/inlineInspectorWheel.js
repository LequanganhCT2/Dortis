/** Pure numeric wheel conversion, shared by all inspector fields. */
export function wheelStepValue(current,deltaY,{step=1,min=-Infinity,max=Infinity,shiftKey=false,altKey=false}={}){
  const base=Number(current),increment=Number(step)
  if(!Number.isFinite(base)||!Number.isFinite(deltaY)||deltaY===0||
      !Number.isFinite(increment)||increment<=0)return base
  const factor=shiftKey?10:(altKey?0.2:1)
  const next=base+(deltaY<0?1:-1)*increment*factor
  // Stop binary floating-point noise for 0.05x photo increments.
  const rounded=Number(next.toFixed(4))
  return Math.min(max,Math.max(min,rounded))
}
