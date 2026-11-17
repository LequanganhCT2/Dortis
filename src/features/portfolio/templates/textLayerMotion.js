/** Per-text-layer reveal preferences. Absent motion remains the historical effect. */
export const TEXT_MOTION_EFFECTS=Object.freeze([
  {id:'auto',label:'Theo hiệu ứng trang'},
  {id:'none',label:'Không hiệu ứng'},
  {id:'fade',label:'Mờ dần'},
  {id:'rise',label:'Bung nổi 3D'},
  {id:'slide',label:'Trượt vào'},
  {id:'zoom',label:'Phóng lớn'},
  {id:'blur',label:'Khử mờ'},
  {id:'flip',label:'Lật 3D'}
])
export const TEXT_MOTION_UNITS=Object.freeze([
  {id:'auto',label:'Theo mặc định'},
  {id:'block',label:'Cả khối'},
  {id:'words',label:'Từng từ'},
  {id:'letters',label:'Từng ký tự'}
])
export const TEXT_MOTION_DIRECTIONS=Object.freeze([
  {id:'up',label:'Từ dưới lên'},
  {id:'down',label:'Từ trên xuống'},
  {id:'left',label:'Từ phải sang'},
  {id:'right',label:'Từ trái sang'}
])
const finite=(value,fallback,min,max)=>{
  const parsed=Number(value)
  return Number.isFinite(parsed)?Math.max(min,Math.min(max,parsed)):fallback
}
const option=(value,options,fallback)=>options.some(item=>item.id===value)?value:fallback
export function normalizeTextMotion(raw={}){
  const motion=raw&&typeof raw==='object'?raw:{}
  return {
    effect:option(motion.effect,TEXT_MOTION_EFFECTS,'auto'),
    unit:option(motion.unit,TEXT_MOTION_UNITS,'auto'),
    direction:option(motion.direction,TEXT_MOTION_DIRECTIONS,'up'),
    duration:Math.round(finite(motion.duration,620,120,2400)),
    delay:Math.round(finite(motion.delay,0,0,1600)),
    stagger:Math.round(finite(motion.stagger,24,0,150)),
    distance:Math.round(finite(motion.distance,38,0,180))
  }
}
export function motionUnit(motion,fallback='letters'){
  const requested=normalizeTextMotion(motion).unit
  return requested==='auto'?fallback:requested
}
export function textMotionAttributes(motion){
  if(!motion||typeof motion!=='object')return {}
  const data=normalizeTextMotion(motion)
  return {
    'data-pt-motion-effect':data.effect,
    'data-pt-motion-unit':data.unit,
    'data-pt-motion-direction':data.direction,
    'data-pt-motion-duration':data.duration,
    'data-pt-motion-delay':data.delay,
    'data-pt-motion-stagger':data.stagger,
    'data-pt-motion-distance':data.distance
  }
}
/** CSS transform is applied to inner glyphs, never to authored frame geometry. */
export function textMotionFrames(effect='fade',direction='up',distance=38){
  const travel=finite(distance,38,0,180)
  const axis=direction==='left'?[travel,0]:direction==='right'?[-travel,0]:
    direction==='down'?[0,-travel]:[0,travel]
  const offset=`translate3d(${axis[0]}px,${axis[1]}px,0)`
  switch(effect){
    case 'slide':return [
      {opacity:0,transform:offset},{opacity:1,transform:'none'}
    ]
    case 'rise':return [
      {opacity:0,transform:offset+' perspective(420px) rotateX(-24deg) scale(.9)'},
      {opacity:1,transform:'translate3d(0,-2px,0) scale(1.02)',offset:.78},
      {opacity:1,transform:'none'}
    ]
    case 'zoom':return [
      {opacity:0,transform:'scale(.68)'},{opacity:1,transform:'scale(1.03)',offset:.78},
      {opacity:1,transform:'none'}
    ]
    case 'blur':return [
      {opacity:0,filter:'blur(12px)',transform:offset},
      {opacity:1,filter:'blur(0px)',transform:'none'}
    ]
    case 'flip':return [
      {opacity:0,transform:'perspective(600px) rotateX(-78deg)'},
      {opacity:1,transform:'perspective(600px) rotateX(0deg)'}
    ]
    case 'none':return [{opacity:1},{opacity:1}]
    default:return [{opacity:0},{opacity:1}]
  }
}
