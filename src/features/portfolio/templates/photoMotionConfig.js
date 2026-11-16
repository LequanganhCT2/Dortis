/** Per-photo, per-artist motion settings; safe defaults for previous uploads. */
export const PHOTO_MOTION_OPTIONS=Object.freeze([
  {id:'still',label:'Tĩnh · Không chuyển động',description:'Không tự chuyển động và không xoay theo chuột'},
  {id:'float',label:'Bay nhẹ · Floating',description:'Ảnh bay lên xuống mềm mại, nghiêng nhẹ theo chuột'},
  {id:'depth',label:'Chiều sâu 3D · Parallax',description:'Ảnh nổi trong không gian, phản ứng theo vị trí chuột'},
  {id:'tilt',label:'Nghiêng 3D · Mouse Tilt',description:'Ảnh xoay theo hướng di chuyển chuột'},
  {id:'orbit',label:'Quỹ đạo · Orbit',description:'Ảnh dịch chuyển và xoay rất nhẹ theo nhịp chậm'},
  {id:'breathe',label:'Nhịp thở · Breathing',description:'Ảnh phóng nhẹ, thu nhẹ theo nhịp tự nhiên'},
  {id:'magnetic',label:'Hút theo chuột · Magnetic',description:'Ảnh di chuyển nhẹ về phía con trỏ'},
  {id:'spotlight',label:'Spotlight 3D',description:'Ánh sáng chạy theo chuột, ảnh có độ nổi và chuyển động'}
])
const MOTION_SET=new Set(PHOTO_MOTION_OPTIONS.map(option=>option.id))
export const DEFAULT_PHOTO_MOTION='float'
export function photoMotionMode(asset){
  return MOTION_SET.has(asset?.motion)?asset.motion:DEFAULT_PHOTO_MOTION
}
export function photoMotionIntensity(asset){
  const value=Number(asset?.motionIntensity)
  return asset?.motionIntensity==null||!Number.isFinite(value)?45:
    Math.max(0,Math.min(100,Math.round(value)))
}
export function photoMotionPointer(asset){
  return asset?.motionPointer!==false
}
export function photoMotionSetting(asset={}){
  return {
    mode:photoMotionMode(asset),
    intensity:photoMotionIntensity(asset),
    pointer:photoMotionPointer(asset)
  }
}
/** Pointer-dependent offsets are strictly bounded and do not mutate saved
 * x/y/scale from the draggable outer image layer. */
export function photoPointerOffsets(mode,x,y,intensity=45){
  const nx=Math.max(-1,Math.min(1,Number(x)||0))
  const ny=Math.max(-1,Math.min(1,Number(y)||0))
  const power=Math.max(0,Math.min(1,Number(intensity)/100||0))
  const strength={
    still:[0,0,0],float:[3,2,1.5],depth:[13,14,11],tilt:[16,0,0],
    orbit:[4,3,2],breathe:[2,0,0],magnetic:[3,23,19],
    spotlight:[12,6,5]
  }[MOTION_SET.has(mode)?mode:'float']
  return {
    rx:(-ny*strength[0]*power).toFixed(2)+'deg',
    ry:(nx*strength[0]*power).toFixed(2)+'deg',
    x:(nx*strength[1]*power).toFixed(2)+'px',
    y:(ny*strength[2]*power).toFixed(2)+'px',
    lx:((nx+1)*50).toFixed(1)+'%',
    ly:((ny+1)*50).toFixed(1)+'%'
  }
}
