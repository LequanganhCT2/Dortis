import {normalizeTextMotion} from './textLayerMotion.js'
import {photoMotionMode,photoMotionIntensity} from './photoMotionConfig.js'
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback
export const STUDIO_KINDS=['title','text','body','image','shape','button']
export const STUDIO_EFFECTS=['inherit','auto','none','fade','rise','slide','zoom','flip','blur','letters']
export const STUDIO_TEXT_KEYS=['size','font','weight','align','spacing','lineHeight','color']
export const isStudioText=kind=>['title','text','body','button'].includes(kind)
export const studioTextRole=kind=>kind==='title'?'title':'body'
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
    ...(kind==='image'&&raw.photoMotion?{
      photoMotion:raw.photoMotion==='inherit'?'inherit':photoMotionMode({motion:raw.photoMotion}),
      photoIntensity:photoMotionIntensity({motionIntensity:raw.photoIntensity}),
      ...(typeof raw.photoPointer==='boolean'?{photoPointer:raw.photoPointer}:{})
    }:{}),
    effect:STUDIO_EFFECTS.includes(raw.effect)?raw.effect:'inherit',
    duration:clamp(raw.duration,.1,5,.8),delay:clamp(raw.delay,0,5,0),
    ...(raw.motion&&typeof raw.motion==='object'?{motion:normalizeTextMotion(raw.motion)}:{}),
    reverse:raw.reverse!==false,hidden:raw.hidden===true,locked:raw.locked===true
  }
}
// Old Studio records persisted every default value, so preserve differences
// from the old defaults as authored overrides. New records track exactly
// which properties the editor has changed, even when equal to a default.
export function resolveStudioLayout(raw={},kind='text',device='desktop'){
  const v=studioLayout(raw,kind,device)
  const defaults=studioLayout({},kind,device)
  const textOverrides=raw.textOverrides&&typeof raw.textOverrides==='object'?
    Object.fromEntries(STUDIO_TEXT_KEYS.filter(k=>raw.textOverrides[k]===true).map(k=>[k,true])):
    Object.fromEntries(STUDIO_TEXT_KEYS.filter(k=>raw[k]!=null&&v[k]!==defaults[k]).map(k=>[k,true]))
  const effect=raw.styleVersion!==2&&raw.effect==='none'&&raw.duration===.8&&raw.delay===0&&raw.reverse!==false?'inherit':v.effect
  return {...v,effect,textOverrides,styleVersion:2}
}
export function studioElements(doc,sectionId){
  return Array.isArray(doc?.studioElements?.[sectionId])?doc.studioElements[sectionId]:[]
}
export function newStudioElement(kind,id,extra={}){
  if(!STUDIO_KINDS.includes(kind)||!id)throw new Error('Loại phần tử không hợp lệ')
  return {id,kind,text:({title:'Tiêu đề mới',text:'Text mới',body:'Nhập nội dung tại đây',button:'Tìm hiểu thêm'})[kind]||'',path:'',alt:'',href:'',...extra,
    desktop:resolveStudioLayout({textOverrides:{},styleVersion:2},kind,'desktop'),mobile:resolveStudioLayout({textOverrides:{},styleVersion:2},kind,'mobile')}
}
export function replaceStudioElements(doc,sectionId,items){
  return {...doc,studioElements:{...(doc.studioElements||{}),[sectionId]:items}}
}
export function patchStudioElement(doc,sectionId,id,device,patch){
  return replaceStudioElements(doc,sectionId,studioElements(doc,sectionId).map(e=>{
    if(e.id!==id)return e
    const {text,path,alt,href,inheritTypography,...style}=patch
    const current=resolveStudioLayout(e[device],e.kind,device)
    const textOverrides=inheritTypography?{}:{...current.textOverrides,...Object.fromEntries(STUDIO_TEXT_KEYS.filter(k=>Object.hasOwn(style,k)).map(k=>[k,true]))}
    return {...e,...(typeof text==='string'?{text:text.slice(0,10000)}:{}),
      ...(typeof path==='string'?{path}:{}),...(typeof alt==='string'?{alt:alt.slice(0,240)}:{}),
      ...(typeof href==='string'?{href:href.slice(0,2000)}:{}),
      [device]:resolveStudioLayout({...current,...style,textOverrides,styleVersion:2},e.kind,device)}
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

export const CONTENT_BLOCK_PRESETS=[
 ['Nghệ danh & Vai trò','Singer','Nhập nghệ danh và vai trò nghệ thuật.'],
 ['Tiểu sử ngắn','Tiểu sử ngắn','Giới thiệu về hành trình âm nhạc và kinh nghiệm của nghệ sĩ.'],
 ['Điểm nổi bật','Điểm nổi bật','Nhập những dấu ấn nổi bật.'],
 ['Thành tích & Giải thưởng','Thành tích & Giải thưởng','Nhập thành tích và năm đạt giải.'],
 ['Kinh nghiệm biểu diễn','Kinh nghiệm biểu diễn','Nhập sân khấu, sự kiện và kinh nghiệm.'],
 ['Phong cách âm nhạc','Phong cách âm nhạc','Nhập thể loại và phong cách.'],
 ['Hình ảnh & Video','Hình ảnh & Video','Thêm hình ảnh hoặc liên kết video.'],
 ['Thông tin liên hệ','Thông tin liên hệ','Nhập thông tin booking và liên hệ.']
]
export function manageContentBlock(pair,id,action,target){
 const sections=pair.snapshot.view.sections
 const source=sections.find(s=>s.id===id)
 if(!source)return pair
 if(action==='clone'){
   const next=addStudioSection(pair,target,source.label+' (bản sao)')
   const copy={...source,id:target,label:source.label+' (bản sao)'}
   const items=studioElements(pair.snapshot,id).map(e=>({...e,id:crypto.randomUUID()}))
   return {content:replaceStudioElements({...next.content,contentBlockOrder:sections.flatMap(s=>s.id===id?[id,target]:[s.id]),sections:{...next.content.sections,[target]:{...pair.content.sections?.[id],title:source.title,body:source.body,eyebrow:source.eyebrow,fieldOverrides:{title:true,body:true,eyebrow:true}}}},target,items),
   snapshot:replaceStudioElements({...next.snapshot,contentBlockOrder:sections.flatMap(s=>s.id===id?[id,target]:[s.id]),view:{...next.snapshot.view,sections:sections.flatMap(s=>s.id===id?[s,copy]:[s])}},target,items)}
 }
 const order=sections.map(s=>s.id)
 if(action==='move'){const from=order.indexOf(id),to=order.indexOf(target);if(to<0)return pair;order.splice(from,1);order.splice(to,0,id)}
 const hidden={...pair.snapshot.contentBlockHidden}
 if(action==='toggle')hidden[id]=!hidden[id]
 return {content:{...pair.content,contentBlockOrder:order,contentBlockHidden:hidden},snapshot:{...pair.snapshot,contentBlockOrder:order,contentBlockHidden:hidden,view:{...pair.snapshot.view,sections:order.map(key=>sections.find(s=>s.id===key))}}}
}
