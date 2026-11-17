import {getScene,patchSceneLayer} from './sectionDesign.js'
import {quickSceneTextPlacement,quickRibbonTextPlacement} from './textQuickLayouts.js'
import {OFFSET_MOVE_LIMIT} from './freePlacement.js'
import {normalizeTextMotion} from './textLayerMotion.js'
import {patchPublishedText} from './publicTextContent.js'

const safe=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0))
export const TEXT_KEYS=new Set(['eyebrow','title','body'])
export const FONT_OPTIONS=[
  {id:'display',label:'Editorial Serif'},
  {id:'condensed',label:'Stage Poster'},
  {id:'sans',label:'Be Vietnam Pro'}
]
export function isImageLayer(id){return /^image:(?:[0-9]|10)$/.test(id||'')}
export function isTextLayer(id){return TEXT_KEYS.has(id)||String(id||'').startsWith('note:')}
export function layerKind(id){return isImageLayer(id)?'image':'text'}

export function lookupPublishedLayer(publication,sectionId,device,layerId){
  const section=publication?.view?.sections?.find(section=>section.id===sectionId)
  if(!section||!['desktop','mobile'].includes(device))return null
  const scene=getScene(publication,section,device)
  if(scene){
    const layer=scene.layers?.[layerId]
    return layer?{section,scene:true,values:layer,kind:layerKind(layerId)}:null
  }
  const pos=publication?.positions?.[sectionId]?.[device]?.[layerId]||{}
  const type=publication?.typography?.[sectionId]?.[device]?.[layerId]||{}
  return {section,scene:false,kind:layerKind(layerId),values:{...pos,...type},position:pos,typography:type}
}
export function patchPublishedElement(document,sectionId,device,layerId,group,patch,sectionOverride){
  if(!document||!['desktop','mobile'].includes(device))return document
  if(!isTextLayer(layerId)&&!isImageLayer(layerId))return document
  const section=sectionOverride||document.view?.sections?.find(s=>s.id===sectionId)
  if(!section)return document
  const scene=getScene(document,section,device)
  if(group==='content'&&isTextLayer(layerId)){
    return patchPublishedText(document,section,device,layerId,patch?.value)
  }
  if(group==='layout'&&isTextLayer(layerId)){
    if(scene){
      const layer=scene.layers[layerId]
      return layer?patchSceneLayer(document,section,device,layerId,
        quickSceneTextPlacement(patch.id,layer,device)):document
    }
    const current=document.positions?.[sectionId]?.[device]?.[layerId]||{}
    const next=quickRibbonTextPlacement(patch.id,current)
    return patchPublishedElement(
      patchPublishedElement(document,sectionId,device,layerId,'position',
        next.position,section),
      sectionId,device,layerId,'typography',next.typography,section)
  }
  if(group==='motion'&&isTextLayer(layerId)){
    if(scene){
      const existing=scene.layers[layerId]
      return existing?patchSceneLayer(document,section,device,layerId,{
        motion:normalizeTextMotion({...existing.motion,...patch})
      }):document
    }
    const current=document.typography?.[sectionId]?.[device]?.[layerId]?.motion||{}
    return patchPublishedElement(document,sectionId,device,layerId,'typography',{
      motion:normalizeTextMotion({...current,...patch})
    },section)
  }
  if(scene){
    const existing=scene.layers[layerId]
    if(!existing)return document
    // Scene layer sanitization enforces safe bounds for sizes / geometry.
    return patchSceneLayer(document,section,device,layerId,patch)
  }
  if(group==='typography'&&isTextLayer(layerId)){
    const typography=document.typography||{}
    const layers=typography[sectionId]||{}
    const deviceValues=layers[device]||{}
    const old=deviceValues[layerId]||{}
    const next={...old,...patch}
    if(next.size!==undefined)next.size=safe(next.size,8,180)
    if(next.lineHeight!==undefined)next.lineHeight=safe(next.lineHeight,.7,3)
    if(next.font&&!FONT_OPTIONS.some(o=>o.id===next.font))next.font=old.font
    if(next.align&&!['left','center','right'].includes(next.align))next.align=old.align
    if(next.weight!==undefined)next.weight=[400,500,600,700,800,900]
      .includes(Number(next.weight))?Number(next.weight):old.weight??500
    if(next.spacing!==undefined)next.spacing=safe(next.spacing,-8,20)
    if(next.color!==undefined&&!/^#[a-f0-9]{6}$/i.test(next.color))
      next.color=old.color||'#ffffff'
    if(next.motion!==undefined)next.motion=normalizeTextMotion(next.motion)
    return {...document,typography:{...typography,[sectionId]:{
      ...layers,[device]:{...deviceValues,[layerId]:next}
    }}}
  }
  if(group!=='position')return document
  const positions=document.positions||{}
  const layers=positions[sectionId]||{}
  const deviceValues=layers[device]||{}
  const old=deviceValues[layerId]||{}
  const next={...old,...patch}
  if(next.x!==undefined)next.x=safe(next.x,-OFFSET_MOVE_LIMIT,OFFSET_MOVE_LIMIT)
  if(next.y!==undefined)next.y=safe(next.y,-OFFSET_MOVE_LIMIT,OFFSET_MOVE_LIMIT)
  if(next.rotation!==undefined)next.rotation=safe(next.rotation,-15,15)
  if(next.widthPct!==undefined&&next.widthPct!==null)next.widthPct=safe(next.widthPct,15,100)
  if(next.radius!==undefined)next.radius=safe(next.radius,0,80)
  if(next.opacity!==undefined)next.opacity=safe(next.opacity,0,100)
  if(next.borderWidth!==undefined)next.borderWidth=safe(next.borderWidth,0,12)
  if(next.borderColor!==undefined&&!/^#[a-f0-9]{6}$/i.test(next.borderColor))
    next.borderColor=old.borderColor||'#ffffff'
  if(isImageLayer(layerId)){
    if(next.scaleX!==undefined)next.scaleX=safe(next.scaleX,.25,3)
    if(next.scaleY!==undefined)next.scaleY=safe(next.scaleY,.25,3)
    if(next.fit&&!['cover','contain'].includes(next.fit))next.fit=old.fit
  }
  return {...document,positions:{...positions,[sectionId]:{
    ...layers,[device]:{...deviceValues,[layerId]:next}
  }}}
}
export function detectCurrentFont(fontFamily=''){
  const family=String(fontFamily).toLowerCase()
  if(family.includes('barlow')||family.includes('impact'))return 'condensed'
  if(family.includes('cormorant')||family.includes('georgia'))return 'display'
  return 'sans'
}
