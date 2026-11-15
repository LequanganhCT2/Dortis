/**
 * Artist instance visual override. Template blueprint remains shared/immutable.
 * Each template section is a separate artboard with desktop/mobile layer layouts.
 * No artist data or image path is copied into the reusable blueprint.
 */
export const SCENE_BACKGROUNDS=Object.freeze([
  {id:'paper',label:'Gallery / Kem',css:'linear-gradient(132deg,#f7f1e8,#e8dfd5 74%,#d7c7b8)'},
  {id:'noir',label:'Noir / Sân khấu',css:'radial-gradient(ellipse at 84% 17%,#795456,#1c1c23 58%,#111218)'},
  {id:'rose',label:'Rose Gold / Ánh sáng',css:'radial-gradient(ellipse at 82% 12%,#f6cdbe,#f9eee0 52%,#e9d5ca)'},
  {id:'ocean',label:'Deep Blue / Gallery',css:'radial-gradient(ellipse at 72% 20%,#4c7785,#193039 57%,#0e1c24)'},
  {id:'white',label:'Minimal / Trắng',css:'linear-gradient(135deg,#ffffff,#f2f4f6)'},
  {id:'stage',label:'Champagne / Spotlight',css:'radial-gradient(ellipse at 75% 20%,#d2bc83,#635542 44%,#17191c)'}
])
export const SCENE_FONTS=Object.freeze([
  {id:'display',label:'Editorial Serif',css:'Cormorant Garamond, Georgia, serif'},
  {id:'condensed',label:'Stage Poster',css:'Barlow Condensed, Impact, sans-serif'},
  {id:'sans',label:'Be Vietnam Pro',css:'Be Vietnam Pro, Arial, sans-serif'}
])
export const SCENE_LAYER_LABELS={eyebrow:'Nhãn phụ',title:'Tiêu đề',body:'Nội dung'}
export const SCENE_DEVICES=['desktop','mobile']
const safe=(n,min,max,other)=>{const x=Number(n);return Number.isFinite(x)?Math.max(min,Math.min(max,x)):other}
const limit=(s,n)=>String(s??'').slice(0,n)
const photo=id=>/^image:([0-9]|10)$/.test(id)
const textId=id=>['eyebrow','title','body'].includes(id)||/^note:[a-f0-9-]{8,45}$/.test(id)
export function sceneLayerIds(section,scene=null){
  const base=['eyebrow','title','body',...Array.from({length:Math.min(10,Math.max(0,Number(section?.slots)||0))},
    (_,index)=>'image:'+index)]
  return [...base,...(scene?.notes||[]).map(note=>'note:'+note.id)]
}
export function sceneLayerTitle(id){return SCENE_LAYER_LABELS[id]||(
  photo(id)?'Ảnh '+(Number(id.split(':')[1])+1):id.startsWith('note:')?'Chữ trang trí':'Layer')}
export function sceneLayerType(id){return photo(id)?'image':'text'}
export function sceneLayerDefault(id,section,device='desktop'){
  const mobile=device==='mobile'
  const layout=String(section?.layout||'split')
  const isCover=layout==='cover'
  const imageIndex=photo(id)?Number(id.split(':')[1]):-1
  const defaults=mobile?{
    eyebrow:{x:7,y:7,w:84,h:6,z:12,size:11,color:isCover?'#f9eadd':'#a78068'},
    title:{x:7,y:15,w:87,h:19,z:13,size:55,color:isCover?'#ffffff':'#262c36'},
    body:{x:8,y:73,w:84,h:22,z:14,size:12,color:isCover?'#f5e9df':'#374350'}
  }:{
    eyebrow:{x:7,y:13,w:49,h:7,z:12,size:14,color:isCover?'#e6cda9':'#a78068'},
    title:{x:7,y:24,w:62,h:25,z:13,size:95,color:isCover?'#ffffff':'#26303b'},
    body:{x:8,y:64,w:45,h:24,z:14,size:17,color:isCover?'#f3eee5':'#3d454c'}
  }
  if(defaults[id])return {
    ...defaults[id],h:defaults[id].h,
    opacity:100,rotation:0,blur:0,
    align:'left',font:id==='title'?'display':'sans',
    weight:id==='title'?600:500,spacing:id==='title'?-2:0,
    lineHeight:id==='title'?1:1.65,hidden:false,
    radius:0,fit:'cover'
  }
  if(imageIndex>=0){
    const d=mobile?[
      {x:17,y:35,w:66,h:35,rotation:3},
      {x:5,y:47,w:32,h:25,rotation:-7},
      {x:65,y:53,w:27,h:25,rotation:6},
      {x:24,y:43,w:45,h:28,rotation:-2}
    ]:[
      {x:57,y:9,w:36,h:79,rotation:3},
      {x:44,y:58,w:24,h:32,rotation:-7},
      {x:78,y:49,w:18,h:32,rotation:6},
      {x:61,y:30,w:23,h:31,rotation:-3}
    ]
    const seed=d[imageIndex%4]
    const shift=Math.floor(imageIndex/4)*5
    return {...seed,x:Math.min(98-seed.w,seed.x+shift),y:Math.min(98-seed.h,seed.y+shift),
      z:4+imageIndex,opacity:100,blur:0,radius:mobile?10:16,fit:'cover',
      hidden:false,size:18,color:'#ffffff',align:'left',font:'sans',
      weight:500,spacing:0,lineHeight:1.4}
  }
  return {x:mobile?12:12,y:mobile?42:53,w:mobile?76:38,h:mobile?12:14,
    z:19,opacity:100,rotation:0,blur:0,
    size:mobile?24:34,color:'#f1e6d7',align:'left',
    font:'display',weight:600,spacing:0,lineHeight:1.1,hidden:false,radius:0,fit:'cover'}
}
export function sanitizeSceneLayer(id,raw={},section={},device='desktop'){
  const d=sceneLayerDefault(id,section,device),v=raw&&typeof raw==='object'?raw:{}
  const w=safe(v.w,8,100,d.w),h=safe(v.h,3,100,d.h)
  return {
    x:safe(v.x,0,100-w,d.x),y:safe(v.y,0,100-h,d.y),
    w,h,z:Math.round(safe(v.z,0,99,d.z)),
    opacity:Math.round(safe(v.opacity,0,100,d.opacity)),
    rotation:safe(v.rotation,-45,45,d.rotation),
    blur:safe(v.blur,0,24,d.blur),
    radius:safe(v.radius,0,50,d.radius),
    fit:['cover','contain'].includes(v.fit)?v.fit:d.fit,
    size:safe(v.size,9,240,d.size),
    color:/^#[a-f0-9]{6}$/i.test(v.color||'')?v.color:d.color,
    align:['left','center','right'].includes(v.align)?v.align:d.align,
    font:SCENE_FONTS.some(x=>x.id===v.font)?v.font:d.font,
    weight:[400,500,600,700,800,900].includes(Number(v.weight))?Number(v.weight):d.weight,
    spacing:safe(v.spacing,-8,20,d.spacing),
    lineHeight:safe(v.lineHeight,.7,3,d.lineHeight),
    hidden:v.hidden===true
  }
}
export function normalizeScene(raw,section,device='desktop'){
  if(!raw||raw.enabled!==true)return null
  const ids=sceneLayerIds(section,raw)
  const source=raw.layers&&typeof raw.layers==='object'?raw.layers:{}
  const layers=Object.fromEntries(ids.map(id=>[id,sanitizeSceneLayer(id,source[id],section,device)]))
  return {enabled:true,background:SCENE_BACKGROUNDS.some(x=>x.id===raw.background)?
    raw.background:'paper',
    notes:(Array.isArray(raw.notes)?raw.notes:[]).filter(n=>
      n&&/^[a-f0-9-]{8,45}$/.test(n.id)).slice(0,8).map(n=>({id:n.id,text:limit(n.text,280)})),
    layers}
}
export function makeScene(section,device='desktop'){
  return normalizeScene({enabled:true,background:
    section?.layout==='cover'?'noir':section?.layout==='mosaic'?'rose':'paper'},section,device)
}
export function getScene(content,section,device='desktop'){
  const settings=content?.scenes?.[section?.id]
  return normalizeScene(settings?.[device],section,device)
}
export function enableSectionScene(content={},section){
  const current=content.scenes?.[section.id]||{}
  const next={...current}
  for(const device of SCENE_DEVICES){
    if(!normalizeScene(next[device],section,device))next[device]=makeScene(section,device)
  }
  return {...content,scenes:{...(content.scenes||{}),[section.id]:next}}
}
export function resetSectionScene(content={},section,device){
  if(!SCENE_DEVICES.includes(device))return content
  const scenes={...(content.scenes||{})}
  const before=scenes[section.id]||{}
  scenes[section.id]={...before,[device]:makeScene(section,device)}
  return {...content,scenes}
}
export function disableSectionScene(content={},sectionId){
  const scenes={...(content.scenes||{})}
  delete scenes[sectionId]
  return {...content,scenes}
}
export function patchSceneLayer(content={},section,device,id,patch={}){
  if(!SCENE_DEVICES.includes(device))return content
  const enabled=enableSectionScene(content,section)
  const original=enabled.scenes[section.id],scene=normalizeScene(original[device],section,device)
  if(!sceneLayerIds(section,scene).includes(id))return content
  const layer=sanitizeSceneLayer(id,{...scene.layers[id],...patch},section,device)
  return {...enabled,scenes:{...enabled.scenes,[section.id]:{...original,
    [device]:{...scene,layers:{...scene.layers,[id]:layer}}}}}
}
export function patchSceneBackground(content={},section,device,background){
  if(!SCENE_BACKGROUNDS.some(x=>x.id===background)||!SCENE_DEVICES.includes(device))
    return content
  const enabled=enableSectionScene(content,section),original=enabled.scenes[section.id]
  return {...enabled,scenes:{...enabled.scenes,[section.id]:{...original,
    [device]:{...original[device],background}}}}
}
export function addSceneNote(content={},section,text='Dòng chữ mới',id){
  if(!/^[a-f0-9-]{8,45}$/.test(id||''))return content
  const enabled=enableSectionScene(content,section)
  const original=enabled.scenes[section.id]
  if(original.desktop.notes.length>=8||original.desktop.notes.some(n=>n.id===id))return content
  const out={...original}
  for(const device of SCENE_DEVICES){
    const scene=normalizeScene(original[device],section,device)
    const layerId='note:'+id
    out[device]={...scene,notes:[...scene.notes,{id,text:limit(text,280)}],
      layers:{...scene.layers,
        [layerId]:sceneLayerDefault(layerId,section,device)}}
  }
  return {...enabled,scenes:{...enabled.scenes,[section.id]:out}}
}
export function patchSceneNote(content={},section,device,id,text){
  const scene=getScene(content,section,device)
  if(!scene||!scene.notes.some(n=>n.id===id))return content
  const own=content.scenes[section.id]
  return {...content,scenes:{...content.scenes,[section.id]:{...own,
    [device]:{...scene,notes:scene.notes.map(n=>n.id===id?{...n,text:limit(text,280)}:n)}}}}
}
export function removeSceneNote(content={},section,id){
  const original=content.scenes?.[section.id]
  if(!original)return content
  const out={...original}
  for(const device of SCENE_DEVICES){
    const s=normalizeScene(original[device],section,device)
    if(!s)continue
    const layers={...s.layers}
    delete layers['note:'+id]
    out[device]={...s,notes:s.notes.filter(n=>n.id!==id),layers}
  }
  return {...content,scenes:{...content.scenes,[section.id]:out}}
}
export function sceneGradient(background){
  return SCENE_BACKGROUNDS.find(x=>x.id===background)?.css||SCENE_BACKGROUNDS[0].css
}
export function sceneFont(font){
  return SCENE_FONTS.find(x=>x.id===font)?.css||SCENE_FONTS[0].css
}
