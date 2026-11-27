const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback
export const STUDIO_KINDS=['title','text','body','image','shape','button']
export const STUDIO_EFFECTS=['none','fade','slide','zoom','flip','blur','letters']
export const STUDIO_FONTS=['Georgia','Arial','Be Vietnam Pro','Cormorant Garamond','Barlow Condensed','Times New Roman']
const hex=(v,d)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:d
export function studioLayout(raw={},kind='text',device='desktop'){
  const mobile=device==='mobile'
  return {
    x:clamp(raw.x,-100,200,10),y:clamp(raw.y,-100,200,32),
    w:clamp(raw.w,4,180,mobile?80:40),h:clamp(raw.h,3,180,kind==='image'?40:kind==='body'?24:15),
    z:clamp(raw.z,1,99,20),rotation:clamp(raw.rotation,-180,180,0),
    size:clamp(raw.size,8,240,kind==='title'?(mobile?48:85):kind==='body'?20:32),
    font:STUDIO_FONTS.includes(raw.font)?raw.font:'Georgia',
    weight:clamp(raw.weight,100,900,kind==='title'?600:400),
    align:['left','center','right'].includes(raw.align)?raw.align:'left',
    spacing:clamp(raw.spacing,-8,20,0),lineHeight:clamp(raw.lineHeight,.7,3,1.25),
    color:hex(raw.color,'#233950'),background:hex(raw.background,'#ffffff'),
    fill:raw.fill==null?(kind==='shape'||kind==='button'):raw.fill===true,
    opacity:clamp(raw.opacity,0,100,100),radius:clamp(raw.radius,0,200,0),
    border:clamp(raw.border,0,20,0),borderColor:hex(raw.borderColor,'#233950'),
    shadow:clamp(raw.shadow,0,80,0),blur:clamp(raw.blur,0,20,0),
    fit:raw.fit==='contain'?'contain':'cover',
    effect:STUDIO_EFFECTS.includes(raw.effect)?raw.effect:'none',
    duration:clamp(raw.duration,.1,5,.8),delay:clamp(raw.delay,0,5,0),
    reverse:raw.reverse!==false,hidden:raw.hidden===true,locked:raw.locked===true
  }
}
export function studioElements(doc,sectionId){
  return Array.isArray(doc?.studioElements?.[sectionId])?doc.studioElements[sectionId]:[]
}
export function newStudioElement(kind,id,extra={}){
  if(!STUDIO_KINDS.includes(kind)||!id)throw new Error('Loại phần tử không hợp lệ')
  return {id,kind,text:({title:'Tiêu đề mới',text:'Text mới',body:'Nhập nội dung tại đây',button:'Tìm hiểu thêm'})[kind]||'',path:'',alt:'',href:'',...extra,
    desktop:studioLayout({},kind,'desktop'),mobile:studioLayout({},kind,'mobile')}
}
export function replaceStudioElements(doc,sectionId,items){
  return {...doc,studioElements:{...(doc.studioElements||{}),[sectionId]:items}}
}
export function patchStudioElement(doc,sectionId,id,device,patch){
  return replaceStudioElements(doc,sectionId,studioElements(doc,sectionId).map(e=>{
    if(e.id!==id)return e
    const {text,path,alt,href,...style}=patch
    return {...e,...(typeof text==='string'?{text:text.slice(0,10000)}:{}),
      ...(typeof path==='string'?{path}:{}),...(typeof alt==='string'?{alt:alt.slice(0,240)}:{}),
      ...(typeof href==='string'?{href:href.slice(0,2000)}:{}),
      [device]:studioLayout({...e[device],...style},e.kind,device)}
  }))
}
export function studioImagePaths(doc){
  return [...new Set(Object.values(doc?.studioElements||{}).flatMap(items=>
    Array.isArray(items)?items.filter(e=>e.kind==='image'&&e.path).map(e=>e.path):[]))]
}
export function snapshotImagePaths(snapshot){
  return [...new Set([...((snapshot?.view?.sections||[]).flatMap(s=>(s.images||[]).map(i=>i?.path).filter(Boolean))),...studioImagePaths(snapshot)])]
}
export function safeStudioHref(value){
  try{const u=new URL(value);return ['https:','http:','mailto:','tel:'].includes(u.protocol)?u.href:undefined}catch{return undefined}
}
export function addStudioSection(pair,id,label){
  const definition={id,label:String(label||'Khu vực mới').slice(0,80),layout:'text',effect:'auto',slots:0}
  return {content:{...pair.content,extraSections:[...(pair.content.extraSections||[]),definition],
    sections:{...(pair.content.sections||{}),[id]:{title:'',body:'',eyebrow:'',fieldOverrides:{title:true,body:true,eyebrow:true}}}},
    snapshot:{...pair.snapshot,view:{...pair.snapshot.view,sections:[...pair.snapshot.view.sections,
      {...definition,title:'',body:'',eyebrow:'',images:[]}]}}}
}
export function withoutPending(content){const {studioPending,...rest}=content||{};return rest}
